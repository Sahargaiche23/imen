# Plainte360 - Gestion Intelligente des Plaintes Citoyennes

Plateforme intelligente de gestion des plaintes citoyennes avec chatbot IA, workflow automatisé et tableau de bord multi-rôles.

## Stack Technique
- **Frontend** : React + Vite + TailwindCSS
- **Backend** : Python + FastAPI
- **Base de données** : SQLite
- **Authentification** : JWT + RBAC

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Citoyen | citoyen@plainte360.dz | citoyen123 |
| Agent | agent@plainte360.dz | agent123 |
| Secrétaire Général | sg@plainte360.dz | sg123 |
| Administrateur | admin@plainte360.dz | admin123 |

## Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur http://localhost:5173
