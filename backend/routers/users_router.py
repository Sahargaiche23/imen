from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user, get_password_hash, require_role
import models
import schemas

router = APIRouter(prefix="/api/users", tags=["Utilisateurs"])


@router.get("", response_model=List[schemas.UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("administrateur"))
):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.get("/agents", response_model=List[schemas.UserOut])
def get_agents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["administrateur", "secretaire_general"]:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return db.query(models.User).filter(models.User.role == "agent").all()


@router.post("", response_model=schemas.UserOut)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("administrateur"))
):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    user = models.User(
        nom=user_data.nom,
        prenom=user_data.prenom,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        telephone=user_data.telephone,
        adresse=user_data.adresse,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    update_data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("administrateur"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if update_data.nom is not None:
        user.nom = update_data.nom
    if update_data.prenom is not None:
        user.prenom = update_data.prenom
    if update_data.email is not None:
        user.email = update_data.email
    if update_data.role is not None:
        user.role = update_data.role
    if update_data.telephone is not None:
        user.telephone = update_data.telephone
    if update_data.adresse is not None:
        user.adresse = update_data.adresse
    if update_data.is_active is not None:
        user.is_active = update_data.is_active

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("administrateur"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas supprimer votre propre compte")

    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}
