import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Calculator, BookOpen, Globe, Users, Leaf, FlaskConical, 
  Languages, Music, Palette, FileText, HelpCircle, Layers, 
  AlignLeft, ListTodo, LogIn, LogOut, User, Sparkles, Upload,
  Save, Trash2, ChevronDown, X, Menu, Home, BookMarked, Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const getToken = () => localStorage.getItem("token");

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Icon mapping
const iconMap = {
  calculator: Calculator,
  "book-open": BookOpen,
  globe: Globe,
  users: Users,
  leaf: Leaf,
  "flask-conical": FlaskConical,
  languages: Languages,
  music: Music,
  palette: Palette,
};

const typeIconMap = {
  fiche: FileText,
  qcm: HelpCircle,
  flashcard: Layers,
  resume: AlignLeft,
  trous: ListTodo,
};

// Subject colors
const subjectColors = {
  maths: "bg-blue-100 hover:bg-blue-200",
  francais: "bg-amber-100 hover:bg-amber-200",
  "histoire-geo": "bg-orange-100 hover:bg-orange-200",
  emc: "bg-pink-100 hover:bg-pink-200",
  svt: "bg-green-100 hover:bg-green-200",
  "physique-chimie": "bg-purple-100 hover:bg-purple-200",
  anglais: "bg-red-100 hover:bg-red-200",
  espagnol: "bg-yellow-100 hover:bg-yellow-200",
  musique: "bg-cyan-100 hover:bg-cyan-200",
  "arts-plastiques": "bg-rose-100 hover:bg-rose-200",
};

// Welcome Popup Component
const WelcomePopup = ({ open, onClose }) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="neo-card max-w-md" data-testid="welcome-popup">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Bienvenue sur 3ème Goya révisions !
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground/80">
            Génère des fiches de révision, QCM et bien plus grâce à l'IA !
            <br /><br />
            <span className="font-semibold text-primary">💡 Conseil :</span> Créer un compte te permet de sauvegarder tes révisions et les retrouver à tout moment. C'est rapide et gratuit !
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <AlertDialogAction 
            onClick={() => { onClose(); window.location.href = "/login"; }}
            className="neo-btn-primary w-full sm:w-auto"
            data-testid="welcome-create-account-btn"
          >
            <User className="w-4 h-4 mr-2" />
            Créer un compte
          </AlertDialogAction>
          <AlertDialogAction 
            onClick={onClose} 
            className="neo-btn-secondary w-full sm:w-auto"
            data-testid="welcome-continue-btn"
          >
            Continuer sans compte
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b-2 border-black no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 font-black text-xl"
            data-testid="nav-logo"
          >
            <span className="text-2xl">📚</span>
            <span className="hidden sm:inline">3ème Goya révisions</span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => window.open("https://sites.google.com/view/bienvenue-sur-3eme-goya/", "_blank")}
              className="font-semibold"
              data-testid="nav-main-site"
            >
              <Globe className="w-4 h-4 mr-2" />
              Retour au site principal
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="font-semibold"
              data-testid="nav-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/generator")}
              className="font-semibold"
              data-testid="nav-generator"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générateur
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="font-semibold"
                data-testid="nav-dashboard"
              >
                <BookMarked className="w-4 h-4 mr-2" />
                Mes révisions
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="neo-btn-secondary py-2" data-testid="nav-user-menu">
                    <User className="w-4 h-4 mr-2" />
                    {user.name}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="neo-card p-2">
                  <DropdownMenuItem 
                    onClick={() => { logout(); navigate("/"); }}
                    className="cursor-pointer"
                    data-testid="nav-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate("/login")}
                className="neo-btn-primary py-2"
                data-testid="nav-login"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="nav-mobile-toggle"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => { window.open("https://sites.google.com/view/bienvenue-sur-3eme-goya/", "_blank"); setMobileMenuOpen(false); }}
              className="w-full justify-start font-semibold"
            >
              <Globe className="w-4 h-4 mr-2" />
              Retour au site principal
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
              className="w-full justify-start font-semibold"
            >
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { navigate("/generator"); setMobileMenuOpen(false); }}
              className="w-full justify-start font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Générateur
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }}
                className="w-full justify-start font-semibold"
              >
                <BookMarked className="w-4 h-4 mr-2" />
                Mes révisions
              </Button>
            )}
            {user ? (
              <Button 
                variant="ghost" 
                onClick={() => { logout(); navigate("/"); setMobileMenuOpen(false); }}
                className="w-full justify-start font-semibold text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            ) : (
              <Button 
                onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                className="w-full neo-btn-primary"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

// Landing Page
const LandingPage = () => {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      sessionStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  const features = [
    { icon: FileText, title: "Fiches de révision", desc: "Résumés structurés et clairs" },
    { icon: HelpCircle, title: "QCM", desc: "Teste tes connaissances" },
    { icon: Layers, title: "Flashcards", desc: "Mémorise efficacement" },
    { icon: AlignLeft, title: "Résumés", desc: "L'essentiel en quelques lignes" },
    { icon: ListTodo, title: "Textes à trous", desc: "Exercices interactifs" },
  ];

  return (
    <>
      <WelcomePopup open={showWelcome} onClose={() => setShowWelcome(false)} />
      
      <div className="min-h-screen hero-pattern" data-testid="landing-page">
        <Navbar />
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
              Révise <span className="gradient-text">intelligemment</span>
              <br />pour le Brevet
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Génère des fiches, QCM et exercices personnalisés en quelques secondes grâce à l'IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                onClick={() => navigate("/generator")}
                className="neo-btn-primary text-lg"
                data-testid="hero-cta"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Commencer à réviser
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            5 façons de réviser
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {features.map((feature, i) => (
              <button 
                key={i}
                onClick={() => navigate("/generator")}
                className="neo-card-hover flex flex-col items-center text-center p-6"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Subjects Preview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Toutes tes matières
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Maths", "Français", "Histoire-Géo", "EMC", "SVT", "Physique-Chimie", "Anglais", "Espagnol", "Musique", "Arts Plastiques"].map((subject, i) => (
              <span 
                key={i}
                className="neo-badge bg-white"
                data-testid={`subject-badge-${i}`}
              >
                {subject}
              </span>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
          <div className="neo-card bg-primary text-white text-center p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Prêt à réussir ton Brevet ?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Commence dès maintenant à créer des révisions personnalisées
            </p>
            <Button 
              onClick={() => navigate("/generator")}
              className="neo-btn-secondary"
              data-testid="cta-button"
            >
              C'est parti !
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

// Generator Page
const GeneratorPage = () => {
  const { user, getToken } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [revisionTypes, setRevisionTypes] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchRevisionTypes();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API}/subjects`);
      setSubjects(res.data.subjects);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRevisionTypes = async () => {
    try {
      const res = await axios.get(`${API}/revision-types`);
      setRevisionTypes(res.data.types);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Format non supporté. Utilisez JPG, PNG ou WebP.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        setImageBase64(base64);
        setImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedType || !prompt.trim()) {
      toast.error("Remplis tous les champs requis");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const headers = {};
      if (user) {
        headers.Authorization = `Bearer ${getToken()}`;
      }

      const res = await axios.post(`${API}/generate`, {
        prompt,
        subject: selectedSubject,
        revision_type: selectedType,
        image_base64: imageBase64
      }, { headers });

      setResult(res.data);
      toast.success("Révision générée avec succès !");
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.detail || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Connecte-toi pour sauvegarder");
      return;
    }

    try {
      await axios.post(`${API}/revisions`, {
        prompt: result.prompt,
        subject: result.subject,
        revision_type: result.revision_type,
        content: result.content
      }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success("Révision sauvegardée !");
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background" data-testid="generator-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6 no-print">
            <div className="neo-card">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Générateur de révisions
              </h2>

              {/* Subject Selection */}
              <div className="mb-6">
                <Label className="text-base font-bold mb-3 block">1. Choisis ta matière</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {subjects.map((subject) => {
                    const Icon = iconMap[subject.icon] || BookOpen;
                    return (
                      <button
                        key={subject.id}
                        onClick={() => setSelectedSubject(subject.id)}
                        className={`subject-card p-3 rounded-xl border-2 border-black text-center transition-all ${subjectColors[subject.id]} ${selectedSubject === subject.id ? "selected" : ""}`}
                        data-testid={`subject-${subject.id}`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-bold block truncate">{subject.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type Selection */}
              <div className="mb-6">
                <Label className="text-base font-bold mb-3 block">2. Type de révision</Label>
                <div className="flex flex-wrap gap-2">
                  {revisionTypes.map((type) => {
                    const Icon = typeIconMap[type.id] || FileText;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`type-toggle flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black font-bold transition-all ${selectedType === type.id ? "selected" : "bg-white hover:bg-muted"}`}
                        data-testid={`type-${type.id}`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <Label className="text-base font-bold mb-3 block">3. Décris ce que tu veux réviser</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Les fonctions affines et linéaires, Le théorème de Pythagore, La Révolution française..."
                  className="neo-input min-h-[100px] resize-none"
                  data-testid="prompt-input"
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <Label className="text-base font-bold mb-3 block">4. Image de ton cours (optionnel)</Label>
                <div className="flex items-center gap-3">
                  <label className="neo-btn-secondary cursor-pointer flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" />
                    {imageName || "Importer une image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="image-upload"
                    />
                  </label>
                  {imageName && (
                    <button 
                      onClick={() => { setImageBase64(null); setImageName(""); }}
                      className="text-destructive hover:text-destructive/80"
                      data-testid="remove-image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !selectedSubject || !selectedType || !prompt.trim()}
                className="neo-btn-primary w-full text-lg disabled:opacity-50"
                data-testid="generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer ma révision
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Panel - Result */}
          <div className="lg:sticky lg:top-24 h-fit">
            {result ? (
              <div className="neo-card" data-testid="result-card">
                <div className="flex items-center justify-between mb-4 no-print">
                  <h3 className="font-bold text-lg">Résultat</h3>
                  <div className="flex gap-2">
                    {user && (
                      <Button 
                        onClick={handleSave}
                        variant="outline"
                        size="sm"
                        className="border-2 border-black"
                        data-testid="save-btn"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Sauvegarder
                      </Button>
                    )}
                    <Button 
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      className="border-2 border-black"
                      data-testid="print-btn"
                    >
                      Imprimer
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[60vh]">
                  <div 
                    className="revision-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatContent(result.content) }}
                    data-testid="result-content"
                  />
                </ScrollArea>
              </div>
            ) : (
              <div className="neo-card flex flex-col items-center justify-center py-20 text-center" data-testid="empty-result">
                <Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-bold text-lg mb-2">Ta révision apparaîtra ici</h3>
                <p className="text-muted-foreground text-sm">Remplis les champs et clique sur "Générer"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Format markdown content to HTML
const formatContent = (content) => {
  if (!content) return "";
  
  let html = content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    // Horizontal rules
    .replace(/---/g, '<hr/>');
  
  return `<p>${html}</p>`;
};

// Dashboard Page
const DashboardPage = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRevisions();
  }, [user, navigate]);

  const fetchRevisions = async () => {
    try {
      const res = await axios.get(`${API}/revisions`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setRevisions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/revisions/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setRevisions(revisions.filter(r => r.id !== id));
      if (selectedRevision?.id === id) setSelectedRevision(null);
      toast.success("Révision supprimée");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getTypeName = (typeId) => {
    const types = {
      fiche: "Fiche",
      qcm: "QCM",
      flashcard: "Flashcard",
      resume: "Résumé",
      trous: "Texte à trous"
    };
    return types[typeId] || typeId;
  };

  const getSubjectName = (subjectId) => {
    const subjects = {
      maths: "Maths",
      francais: "Français",
      "histoire-geo": "Histoire-Géo",
      emc: "EMC",
      svt: "SVT",
      "physique-chimie": "Physique-Chimie",
      anglais: "Anglais",
      espagnol: "Espagnol",
      musique: "Musique",
      "arts-plastiques": "Arts Plastiques"
    };
    return subjects[subjectId] || subjectId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <BookMarked className="w-8 h-8 text-primary" />
          Mes révisions
        </h1>

        {revisions.length === 0 ? (
          <div className="neo-card text-center py-16" data-testid="empty-dashboard">
            <BookMarked className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Aucune révision sauvegardée</h3>
            <p className="text-muted-foreground mb-6">Génère ta première révision et sauvegarde-la ici</p>
            <Button onClick={() => navigate("/generator")} className="neo-btn-primary">
              <Sparkles className="w-5 h-5 mr-2" />
              Créer une révision
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revisions List */}
            <div className="lg:col-span-1 space-y-3">
              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  onClick={() => setSelectedRevision(revision)}
                  className={`neo-card-hover cursor-pointer ${selectedRevision?.id === revision.id ? "ring-2 ring-primary" : ""}`}
                  data-testid={`revision-card-${revision.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`neo-badge text-xs ${subjectColors[revision.subject]}`}>
                          {getSubjectName(revision.subject)}
                        </span>
                        <span className="neo-badge text-xs bg-white">
                          {getTypeName(revision.revision_type)}
                        </span>
                      </div>
                      <p className="font-semibold text-sm truncate">{revision.prompt}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(revision.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(revision.id); }}
                      className="text-destructive hover:text-destructive/80 ml-2"
                      data-testid={`delete-btn-${revision.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Revision Content */}
            <div className="lg:col-span-2">
              {selectedRevision ? (
                <div className="neo-card" data-testid="revision-detail">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{selectedRevision.prompt}</h3>
                    <Button onClick={() => window.print()} variant="outline" size="sm" className="border-2 border-black">
                      Imprimer
                    </Button>
                  </div>
                  <ScrollArea className="h-[60vh]">
                    <div 
                      className="revision-content prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatContent(selectedRevision.content) }}
                    />
                  </ScrollArea>
                </div>
              ) : (
                <div className="neo-card flex items-center justify-center h-[60vh] text-center">
                  <div>
                    <BookMarked className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Sélectionne une révision pour la consulter</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Login Page
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister 
        ? formData 
        : { email: formData.email, password: formData.password };
      
      const res = await axios.post(`${API}${endpoint}`, payload);
      login(res.data.token, res.data.user);
      toast.success(isRegister ? "Compte créé avec succès !" : "Connexion réussie !");
      navigate("/generator");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="login-page">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="neo-card">
          <h1 className="text-2xl font-bold text-center mb-6">
            {isRegister ? "Créer un compte" : "Connexion"}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <Label htmlFor="name">Prénom</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="neo-input mt-1"
                  placeholder="Ton prénom"
                  required={isRegister}
                  data-testid="name-input"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="neo-input mt-1"
                placeholder="ton@email.com"
                required
                data-testid="email-input"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="neo-input mt-1"
                placeholder="••••••••"
                required
                data-testid="password-input"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="neo-btn-primary w-full"
              data-testid="auth-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRegister ? (
                "Créer mon compte"
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary hover:underline font-medium"
              data-testid="toggle-auth-mode"
            >
              {isRegister 
                ? "Déjà un compte ? Se connecter" 
                : "Pas de compte ? En créer un"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/generator" element={<GeneratorPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
