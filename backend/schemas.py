from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ---- Auth ----
class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---- User ----
class UserCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    password: str
    role: str = "citoyen"
    telephone: Optional[str] = None
    adresse: Optional[str] = None


class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    is_active: Optional[int] = None


class UserOut(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Plainte ----
class PlainteCreate(BaseModel):
    titre: str
    description: str
    categorie: str = "autre"
    urgence: str = "moyenne"
    localisation: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None


class PlainteUpdate(BaseModel):
    statut: Optional[str] = None
    reponse_agent: Optional[str] = None
    commentaire_sg: Optional[str] = None
    agent_id: Optional[int] = None
    categorie: Optional[str] = None
    urgence: Optional[str] = None
    feedback_citoyen: Optional[str] = None
    satisfaction: Optional[str] = None


class PlainteOut(BaseModel):
    id: int
    citoyen_id: int
    agent_id: Optional[int] = None
    titre: str
    description: str
    categorie: str
    urgence: str
    statut: str
    localisation: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None
    resume_ia: Optional[str] = None
    reponse_agent: Optional[str] = None
    commentaire_sg: Optional[str] = None
    feedback_citoyen: Optional[str] = None
    satisfaction: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    citoyen: Optional[UserOut] = None
    agent: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ---- Historique ----
class HistoriqueOut(BaseModel):
    id: int
    plainte_id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Chatbot ----
class ChatMessage(BaseModel):
    message: str
    plainte_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    photo_base64: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    plainte_id: Optional[int] = None
    plainte_created: bool = False


# ---- Notification ----
class NotificationOut(BaseModel):
    id: int
    user_id: int
    plainte_id: Optional[int] = None
    type: str
    titre: str
    message: str
    lu: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Stats ----
class StatsOut(BaseModel):
    total_plaintes: int
    en_attente: int
    en_cours: int
    resolues: int
    urgentes: int
    par_categorie: dict
    par_mois: Optional[list] = None
    par_statut: Optional[dict] = None
    satisfaction: Optional[dict] = None
