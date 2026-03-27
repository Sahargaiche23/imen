from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import User, Plainte, Historique, Notification
from auth import get_password_hash
from routers import auth_router, complaints_router, users_router, chatbot_router, notifications_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Plainte360 API",
    description="API de gestion intelligente des plaintes citoyennes",
    version="1.0.0",
    redirect_slashes=False
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(complaints_router.router)
app.include_router(users_router.router)
app.include_router(chatbot_router.router)
app.include_router(notifications_router.router)


@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            users = [
                User(
                    nom="Admin", prenom="Système",
                    email="admin@plainte360.dz",
                    password_hash=get_password_hash("admin123"),
                    role="administrateur"
                ),
                User(
                    nom="Benmoussa", prenom="Karim",
                    email="agent@plainte360.dz",
                    password_hash=get_password_hash("agent123"),
                    role="agent",
                    telephone="0555123456"
                ),
                User(
                    nom="Khelifi", prenom="Samira",
                    email="sg@plainte360.dz",
                    password_hash=get_password_hash("sg123"),
                    role="secretaire_general",
                    telephone="0555654321"
                ),
                User(
                    nom="Ben Salem", prenom="Ahmed",
                    email="citoyen@plainte360.dz",
                    password_hash=get_password_hash("citoyen123"),
                    role="citoyen",
                    telephone="0555111222",
                    adresse="Rue Habib Bourguiba"
                ),
            ]
            db.add_all(users)
            db.commit()

            # Seed some demo plaintes
            plaintes = [
                Plainte(
                    citoyen_id=4, titre="Panne d'éclairage public",
                    description="Les lampadaires de la rue Habib Bourguiba ne fonctionnent plus depuis une semaine. La nuit on ne voit rien.",
                    categorie="eclairage_public", urgence="haute", statut="soumise",
                    localisation="Rue Habib Bourguiba, à côté du café central",
                    resume_ia="Panne d'éclairage public depuis 7 jours, danger pour la sécurité"
                ),
                Plainte(
                    citoyen_id=4, titre="Nid de poule dangereux",
                    description="Un grand nid de poule s'est formé sur la route principale près du marché.",
                    categorie="voirie", urgence="haute", statut="en_cours",
                    agent_id=2,
                    localisation="Route principale, près du marché central",
                    resume_ia="Nid de poule sur route principale, risque d'accident",
                    reponse_agent="Intervention prévue la semaine prochaine."
                ),
                Plainte(
                    citoyen_id=4, titre="Fuite d'eau",
                    description="Une fuite d'eau importante au niveau du trottoir devant l'école.",
                    categorie="assainissement", urgence="moyenne", statut="traitee",
                    agent_id=2,
                    localisation="Devant l'école primaire, rue des Martyrs",
                    resume_ia="Fuite d'eau devant école, gaspillage et risque de glissade",
                    reponse_agent="Remplacement de la canalisation effectué."
                ),
                Plainte(
                    citoyen_id=4, titre="Nuisance sonore nocturne",
                    description="Tapage nocturne régulier provenant d'un café voisin après minuit.",
                    categorie="nuisance_sonore", urgence="moyenne", statut="validee",
                    agent_id=2,
                    localisation="Quartier El Amir, bloc B",
                    resume_ia="Nuisance sonore récurrente après minuit",
                    reponse_agent="Avertissement envoyé au propriétaire du café.",
                    commentaire_sg="Validé. Suivi à prévoir dans 2 semaines."
                ),
            ]
            db.add_all(plaintes)
            db.commit()

            print("✅ Base de données initialisée avec les données de démonstration")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API Plainte360", "version": "1.0.0"}
