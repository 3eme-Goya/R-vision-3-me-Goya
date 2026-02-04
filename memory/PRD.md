# 3ème Goya Révisions - PRD

## Problème Original
Application qui génère des fiches de révision, des QCM et autres moyens de révisions à partir d'un prompt, de la matière (sélectionnable depuis une liste déroulante) et optionnellement une image de cours.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Neo-Brutalist Design)
- **Backend**: FastAPI + MongoDB
- **IA**: OpenAI GPT-5.2 via Emergent Integrations Library

## User Personas
- Élèves de 3ème préparant le Brevet des collèges
- Utilisateurs souhaitant des révisions personnalisées rapidement

## Core Requirements (Static)
1. ✅ Génération IA de révisions (fiches, QCM, flashcards, résumés, textes à trous)
2. ✅ 10 matières: Maths, Français, Histoire-Géo, EMC, SVT, Physique-Chimie, Anglais, Espagnol, Musique, Arts Plastiques
3. ✅ Import d'images de cours (optionnel)
4. ✅ Authentification optionnelle avec popup de rappel
5. ✅ Sauvegarde des révisions pour utilisateurs connectés

## What's Been Implemented (04/02/2026)
- [x] Landing page avec popup de bienvenue
- [x] Page générateur avec sélection matière/type
- [x] Génération IA via GPT-5.2
- [x] Upload d'images de cours
- [x] Authentification (login/register)
- [x] Dashboard de révisions sauvegardées
- [x] CRUD complet des révisions
- [x] Impression des révisions
- [x] Design Neo-Brutalist responsive

## Prioritized Backlog
### P0 (Done)
- Toutes les fonctionnalités core implémentées

### P1 (Future)
- Mode hors-ligne avec PWA
- Partage de révisions entre élèves
- Statistiques de progression

### P2 (Nice to have)
- Mode quiz interactif
- Système de badges/gamification
- Export PDF

## Next Tasks
1. Ajouter mode quiz interactif pour les QCM
2. Système de partage de révisions
3. PWA pour utilisation hors-ligne
