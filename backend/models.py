from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class RoleEnum(str, enum.Enum):
    citoyen = "citoyen"
    agent = "agent"
    secretaire_general = "secretaire_general"
    administrateur = "administrateur"


class StatutEnum(str, enum.Enum):
    soumise = "soumise"
    en_cours = "en_cours"
    traitee = "traitee"
    validee = "validee"
    rejetee = "rejetee"
    retour_agent = "retour_agent"


class CategorieEnum(str, enum.Enum):
    voirie = "voirie"
    urbanisme = "urbanisme"
    assainissement = "assainissement"
    eclairage_public = "eclairage_public"
    nuisance_sonore = "nuisance_sonore"
    administratif = "administratif"
    autre = "autre"


class UrgenceEnum(str, enum.Enum):
    basse = "basse"
    moyenne = "moyenne"
    haute = "haute"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=RoleEnum.citoyen)
    telephone = Column(String(20), nullable=True)
    adresse = Column(String(255), nullable=True)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    plaintes = relationship("Plainte", back_populates="citoyen", foreign_keys="Plainte.citoyen_id")
    traitements = relationship("Plainte", back_populates="agent", foreign_keys="Plainte.agent_id")


class Plainte(Base):
    __tablename__ = "plaintes"

    id = Column(Integer, primary_key=True, index=True)
    citoyen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    titre = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    categorie = Column(String(50), default=CategorieEnum.autre)
    urgence = Column(String(20), default=UrgenceEnum.moyenne)
    statut = Column(String(50), default=StatutEnum.soumise)
    localisation = Column(String(255), nullable=True)
    resume_ia = Column(Text, nullable=True)
    reponse_agent = Column(Text, nullable=True)
    commentaire_sg = Column(Text, nullable=True)
    feedback_citoyen = Column(Text, nullable=True)
    satisfaction = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citoyen = relationship("User", back_populates="plaintes", foreign_keys=[citoyen_id])
    agent = relationship("User", back_populates="traitements", foreign_keys=[agent_id])
    historiques = relationship("Historique", back_populates="plainte")


class Historique(Base):
    __tablename__ = "historiques"

    id = Column(Integer, primary_key=True, index=True)
    plainte_id = Column(Integer, ForeignKey("plaintes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plainte = relationship("Plainte", back_populates="historiques")
    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plainte_id = Column(Integer, ForeignKey("plaintes.id"), nullable=True)
    type = Column(String(50), nullable=False)
    titre = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    lu = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    plainte = relationship("Plainte")
