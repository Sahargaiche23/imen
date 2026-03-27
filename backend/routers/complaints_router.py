from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from database import get_db
from auth import get_current_user, require_role
from routers.chatbot_router import generate_resume_ia
from routers.notifications_router import create_notification
import models
import schemas
from datetime import datetime, timedelta
from sqlalchemy import extract

router = APIRouter(prefix="/api/plaintes", tags=["Plaintes"])


@router.post("", response_model=schemas.PlainteOut)
def create_plainte(
    plainte_data: schemas.PlainteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plainte = models.Plainte(
        citoyen_id=current_user.id,
        titre=plainte_data.titre,
        description=plainte_data.description,
        categorie=plainte_data.categorie,
        urgence=plainte_data.urgence,
        localisation=plainte_data.localisation,
        statut="soumise",
        resume_ia=generate_resume_ia(plainte_data.description, plainte_data.categorie, plainte_data.urgence, plainte_data.localisation or ""),
    )
    db.add(plainte)
    db.commit()
    db.refresh(plainte)

    historique = models.Historique(
        plainte_id=plainte.id,
        user_id=current_user.id,
        action="Plainte soumise",
        details=f"Nouvelle plainte créée : {plainte.titre}"
    )
    db.add(historique)
    db.commit()

    return plainte


@router.get("", response_model=List[schemas.PlainteOut])
def get_plaintes(
    statut: Optional[str] = None,
    categorie: Optional[str] = None,
    urgence: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Plainte).options(
        joinedload(models.Plainte.citoyen),
        joinedload(models.Plainte.agent)
    )

    if current_user.role == "citoyen":
        query = query.filter(models.Plainte.citoyen_id == current_user.id)
    elif current_user.role == "agent":
        query = query.filter(
            (models.Plainte.agent_id == current_user.id) |
            (models.Plainte.statut == "soumise") |
            (models.Plainte.statut == "retour_agent")
        )

    if statut:
        query = query.filter(models.Plainte.statut == statut)
    if categorie:
        query = query.filter(models.Plainte.categorie == categorie)
    if urgence:
        query = query.filter(models.Plainte.urgence == urgence)

    return query.order_by(models.Plainte.created_at.desc()).all()


@router.get("/stats", response_model=schemas.StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    base_query = db.query(models.Plainte)
    if current_user.role == "citoyen":
        base_query = base_query.filter(models.Plainte.citoyen_id == current_user.id)
    elif current_user.role == "agent":
        base_query = base_query.filter(
            (models.Plainte.agent_id == current_user.id) |
            (models.Plainte.statut == "soumise")
        )

    total = base_query.count()
    en_attente = base_query.filter(models.Plainte.statut == "soumise").count()
    en_cours = base_query.filter(models.Plainte.statut.in_(["en_cours", "traitee", "retour_agent"])).count()
    resolues = base_query.filter(models.Plainte.statut == "validee").count()
    urgentes = base_query.filter(models.Plainte.urgence == "haute").count()

    categories = db.query(
        models.Plainte.categorie, func.count(models.Plainte.id)
    )
    if current_user.role == "citoyen":
        categories = categories.filter(models.Plainte.citoyen_id == current_user.id)
    categories = categories.group_by(models.Plainte.categorie).all()
    par_categorie = {cat: count for cat, count in categories}

    # Monthly stats (last 6 months)
    now = datetime.utcnow()
    par_mois = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        month, year = d.month, d.year
        mq = db.query(func.count(models.Plainte.id)).filter(
            extract('month', models.Plainte.created_at) == month,
            extract('year', models.Plainte.created_at) == year,
        )
        if current_user.role == "citoyen":
            mq = mq.filter(models.Plainte.citoyen_id == current_user.id)
        elif current_user.role == "agent":
            mq = mq.filter(
                (models.Plainte.agent_id == current_user.id) | (models.Plainte.statut == "soumise")
            )
        count = mq.scalar() or 0
        mois_labels = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
        par_mois.append({"mois": mois_labels[month], "count": count})

    # Status distribution
    statuts_q = db.query(models.Plainte.statut, func.count(models.Plainte.id))
    if current_user.role == "citoyen":
        statuts_q = statuts_q.filter(models.Plainte.citoyen_id == current_user.id)
    elif current_user.role == "agent":
        statuts_q = statuts_q.filter(
            (models.Plainte.agent_id == current_user.id) | (models.Plainte.statut == "soumise")
        )
    par_statut = {s: c for s, c in statuts_q.group_by(models.Plainte.statut).all()}

    # Satisfaction stats
    sat_q = db.query(models.Plainte.satisfaction, func.count(models.Plainte.id)).filter(
        models.Plainte.satisfaction.isnot(None)
    )
    if current_user.role == "citoyen":
        sat_q = sat_q.filter(models.Plainte.citoyen_id == current_user.id)
    elif current_user.role == "agent":
        sat_q = sat_q.filter(models.Plainte.agent_id == current_user.id)
    satisfaction = {s: c for s, c in sat_q.group_by(models.Plainte.satisfaction).all()}

    return schemas.StatsOut(
        total_plaintes=total,
        en_attente=en_attente,
        en_cours=en_cours,
        resolues=resolues,
        urgentes=urgentes,
        par_categorie=par_categorie,
        par_mois=par_mois,
        par_statut=par_statut,
        satisfaction=satisfaction,
    )


@router.get("/{plainte_id}", response_model=schemas.PlainteOut)
def get_plainte(
    plainte_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plainte = db.query(models.Plainte).options(
        joinedload(models.Plainte.citoyen),
        joinedload(models.Plainte.agent)
    ).filter(models.Plainte.id == plainte_id).first()

    if not plainte:
        raise HTTPException(status_code=404, detail="Plainte non trouvée")

    if current_user.role == "citoyen" and plainte.citoyen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    return plainte


@router.put("/{plainte_id}", response_model=schemas.PlainteOut)
def update_plainte(
    plainte_id: int,
    update_data: schemas.PlainteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plainte = db.query(models.Plainte).filter(models.Plainte.id == plainte_id).first()
    if not plainte:
        raise HTTPException(status_code=404, detail="Plainte non trouvée")

    action_detail = ""

    if current_user.role == "agent":
        if update_data.reponse_agent is not None:
            plainte.reponse_agent = update_data.reponse_agent
            plainte.statut = "traitee"
            plainte.agent_id = current_user.id
            action_detail = "Réponse de l'agent ajoutée"
            # Notify SG: new response to validate
            sgs = db.query(models.User).filter(models.User.role == "secretaire_general").all()
            for sg in sgs:
                create_notification(db, sg.id, plainte.id, "nouvelle_reponse",
                    f"Nouvelle réponse — Plainte #{plainte.id}",
                    f"L'agent {current_user.prenom} {current_user.nom} a soumis une réponse pour la plainte \"{plainte.titre}\".")
        if update_data.statut == "en_cours":
            plainte.statut = "en_cours"
            plainte.agent_id = current_user.id
            action_detail = "Plainte prise en charge par l'agent"
            # Notify citizen
            create_notification(db, plainte.citoyen_id, plainte.id, "prise_en_charge",
                f"Plainte #{plainte.id} prise en charge",
                f"L'agent {current_user.prenom} {current_user.nom} traite votre plainte \"{plainte.titre}\".")

    elif current_user.role == "secretaire_general":
        if update_data.statut == "validee":
            plainte.statut = "validee"
            plainte.commentaire_sg = update_data.commentaire_sg or "Validé par le Secrétaire Général"
            action_detail = "Réponse validée par le SG"
            # Notify agent
            if plainte.agent_id:
                create_notification(db, plainte.agent_id, plainte.id, "validation_sg",
                    f"Plainte #{plainte.id} validée par le SG",
                    f"Le Secrétaire Général a validé votre réponse pour \"{plainte.titre}\".")
            # Notify citizen
            create_notification(db, plainte.citoyen_id, plainte.id, "reponse_validee",
                f"Réponse disponible — Plainte #{plainte.id}",
                f"Votre plainte \"{plainte.titre}\" a reçu une réponse officielle. Consultez-la et donnez votre avis.")
        elif update_data.statut == "retour_agent":
            plainte.statut = "retour_agent"
            plainte.commentaire_sg = update_data.commentaire_sg or "Retour pour correction"
            action_detail = "Retour à l'agent par le SG"
            # Notify agent
            if plainte.agent_id:
                create_notification(db, plainte.agent_id, plainte.id, "retour_sg",
                    f"Retour SG — Plainte #{plainte.id}",
                    f"Le SG demande une correction : {plainte.commentaire_sg}")

    elif current_user.role == "citoyen":
        if plainte.citoyen_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if update_data.feedback_citoyen is not None:
            plainte.feedback_citoyen = update_data.feedback_citoyen
        if update_data.satisfaction is not None:
            plainte.satisfaction = update_data.satisfaction
            action_detail = f"Retour citoyen : {update_data.satisfaction}"
            # Notify agent
            if plainte.agent_id:
                label = "satisfait" if update_data.satisfaction == "satisfait" else "non satisfait"
                create_notification(db, plainte.agent_id, plainte.id, "feedback_citoyen",
                    f"Retour citoyen — Plainte #{plainte.id}",
                    f"Le citoyen est {label} de votre réponse pour \"{plainte.titre}\".")
            # Notify SG
            sgs = db.query(models.User).filter(models.User.role == "secretaire_general").all()
            for sg in sgs:
                create_notification(db, sg.id, plainte.id, "feedback_citoyen",
                    f"Retour citoyen — Plainte #{plainte.id}",
                    f"Le citoyen a donné son avis ({update_data.satisfaction}) sur la plainte \"{plainte.titre}\".")

    elif current_user.role == "administrateur":
        if update_data.statut:
            plainte.statut = update_data.statut
        if update_data.agent_id:
            plainte.agent_id = update_data.agent_id
        if update_data.categorie:
            plainte.categorie = update_data.categorie
        if update_data.urgence:
            plainte.urgence = update_data.urgence
        action_detail = "Plainte modifiée par l'administrateur"

    plainte.updated_at = datetime.utcnow()

    if action_detail:
        historique = models.Historique(
            plainte_id=plainte.id,
            user_id=current_user.id,
            action=action_detail,
            details=update_data.commentaire_sg or update_data.reponse_agent or ""
        )
        db.add(historique)

    db.commit()
    db.refresh(plainte)
    return plainte


@router.get("/{plainte_id}/historique", response_model=List[schemas.HistoriqueOut])
def get_historique(
    plainte_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    plainte = db.query(models.Plainte).filter(models.Plainte.id == plainte_id).first()
    if not plainte:
        raise HTTPException(status_code=404, detail="Plainte non trouvée")

    if current_user.role == "citoyen" and plainte.citoyen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    return db.query(models.Historique).filter(
        models.Historique.plainte_id == plainte_id
    ).order_by(models.Historique.created_at.desc()).all()
