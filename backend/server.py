from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class RevisionRequest(BaseModel):
    prompt: str
    subject: str
    revision_type: str
    image_base64: Optional[str] = None

class RevisionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: Optional[str] = None
    prompt: str
    subject: str
    revision_type: str
    content: str
    created_at: str

class SaveRevisionRequest(BaseModel):
    prompt: str
    subject: str
    revision_type: str
    content: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    token = create_token(user_id)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, created_at=user["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(user["id"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])

# ============== LLM GENERATION ==============

def get_system_prompt(subject: str, revision_type: str) -> str:
    prompts = {
        "fiche": f"""Tu es un expert pédagogue français spécialisé en {subject} pour les élèves de 3ème.
Crée une fiche de révision claire et structurée avec:
- Un titre accrocheur
- Les notions clés en gras
- Des définitions simples
- Des exemples concrets
- Des astuces pour retenir
Utilise des emojis pour rendre la fiche attractive. Format en Markdown.""",
        
        "qcm": f"""Tu es un expert pédagogue français spécialisé en {subject} pour les élèves de 3ème.
Crée un QCM de 10 questions avec:
- 4 réponses possibles (A, B, C, D)
- Une seule bonne réponse par question
- Des explications courtes après chaque réponse
À la fin, donne les réponses correctes.
Format clair et lisible en Markdown.""",
        
        "flashcard": f"""Tu es un expert pédagogue français spécialisé en {subject} pour les élèves de 3ème.
Crée 10 flashcards de révision avec:
- RECTO: Question ou terme à définir
- VERSO: Réponse ou définition
Sépare chaque flashcard clairement.
Format en Markdown avec --- entre chaque carte.""",
        
        "resume": f"""Tu es un expert pédagogue français spécialisé en {subject} pour les élèves de 3ème.
Crée un résumé synthétique avec:
- Les points essentiels à retenir
- Maximum 500 mots
- Structure claire avec titres
- Mots-clés en gras
Format en Markdown.""",
        
        "trous": f"""Tu es un expert pédagogue français spécialisé en {subject} pour les élèves de 3ème.
Crée un exercice de texte à trous avec:
- 10-15 mots manquants (remplacés par _____)
- Un texte cohérent sur le sujet demandé
- La liste des mots à placer en désordre
- Les réponses à la fin
Format en Markdown."""
    }
    return prompts.get(revision_type, prompts["fiche"])

@api_router.post("/generate", response_model=RevisionResponse)
async def generate_revision(request: RevisionRequest, authorization: str = Header(None)):
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Clé API non configurée")
    
    user = await get_current_user(authorization)
    user_id = user["id"] if user else None
    
    session_id = str(uuid.uuid4())
    system_prompt = get_system_prompt(request.subject, request.revision_type)
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_prompt
    ).with_model("openai", "gpt-5.2")
    
    # Build message with optional image
    if request.image_base64:
        image_content = ImageContent(image_base64=request.image_base64)
        user_message = UserMessage(
            text=f"Voici le sujet/cours à réviser: {request.prompt}\n\nAnalyse également l'image jointe si pertinente.",
            file_contents=[image_content]
        )
    else:
        user_message = UserMessage(text=f"Voici le sujet/cours à réviser: {request.prompt}")
    
    try:
        response = await chat.send_message(user_message)
        
        revision_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        
        return RevisionResponse(
            id=revision_id,
            user_id=user_id,
            prompt=request.prompt,
            subject=request.subject,
            revision_type=request.revision_type,
            content=response,
            created_at=created_at
        )
    except Exception as e:
        logger.error(f"Error generating revision: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur de génération: {str(e)}")

# ============== SAVED REVISIONS ==============

@api_router.post("/revisions", response_model=RevisionResponse)
async def save_revision(request: SaveRevisionRequest, authorization: str = Header(None)):
    
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Connectez-vous pour sauvegarder")
    
    revision_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    revision = {
        "id": revision_id,
        "user_id": user["id"],
        "prompt": request.prompt,
        "subject": request.subject,
        "revision_type": request.revision_type,
        "content": request.content,
        "created_at": created_at
    }
    
    await db.revisions.insert_one(revision)
    
    return RevisionResponse(**revision)

@api_router.get("/revisions", response_model=List[RevisionResponse])
async def get_revisions(authorization: str = Header(None)):
    
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    revisions = await db.revisions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return revisions

@api_router.delete("/revisions/{revision_id}")
async def delete_revision(revision_id: str, authorization: str = Header(None)):
    
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    result = await db.revisions.delete_one({"id": revision_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Révision non trouvée")
    
    return {"message": "Révision supprimée"}

# ============== SUBJECTS ==============

@api_router.get("/subjects")
async def get_subjects():
    return {
        "subjects": [
            {"id": "maths", "name": "Mathématiques", "icon": "calculator"},
            {"id": "francais", "name": "Français", "icon": "book-open"},
            {"id": "histoire-geo", "name": "Histoire-Géographie", "icon": "globe"},
            {"id": "emc", "name": "EMC", "icon": "users"},
            {"id": "svt", "name": "SVT", "icon": "leaf"},
            {"id": "physique-chimie", "name": "Physique-Chimie", "icon": "flask-conical"},
            {"id": "anglais", "name": "Anglais", "icon": "languages"},
            {"id": "espagnol", "name": "Espagnol", "icon": "languages"},
            {"id": "musique", "name": "Musique", "icon": "music"},
            {"id": "arts-plastiques", "name": "Arts Plastiques", "icon": "palette"}
        ]
    }

@api_router.get("/revision-types")
async def get_revision_types():
    return {
        "types": [
            {"id": "fiche", "name": "Fiche de révision", "description": "Résumé structuré des notions clés"},
            {"id": "qcm", "name": "QCM", "description": "Questions à choix multiples pour s'entraîner"},
            {"id": "flashcard", "name": "Flashcards", "description": "Cartes recto-verso pour mémoriser"},
            {"id": "resume", "name": "Résumé", "description": "Synthèse courte et efficace"},
            {"id": "trous", "name": "Texte à trous", "description": "Exercice de complétion"}
        ]
    }

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "3ème Goya Révisions API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
