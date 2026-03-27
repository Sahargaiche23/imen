from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas
import re

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

CATEGORIES_KEYWORDS = {
    "voirie": ["route", "trottoir", "chaussée", "nid de poule", "bitume", "goudron", "voirie", "rue", "passage", "carrefour", "pont", "chemin", "avenue", "boulevard"],
    "eclairage_public": ["lampadaire", "éclairage", "lumière", "lampe", "nuit", "noir", "eclairage", "lampadaires", "sombre", "obscurité", "ampoule", "poteau électrique"],
    "assainissement": ["égout", "eau", "inondation", "canalisation", "assainissement", "fuite", "débouchage", "boue", "stagnante", "odeur", "drainage", "tuyau", "robinet"],
    "nuisance_sonore": ["bruit", "nuisance", "sonore", "musique", "tapage", "vacarme", "klaxon", "travaux bruyants", "voisin", "discothèque", "café"],
    "urbanisme": ["construction", "bâtiment", "permis", "urbanisme", "immeuble", "terrain", "clôture", "mur", "façade", "démolition"],
    "administratif": ["document", "certificat", "attestation", "administratif", "papier", "formulaire", "acte", "inscription", "dossier"],
}

URGENCY_INDICATORS = {
    "haute": ["danger", "urgent", "grave", "urgence", "critique", "accident", "effondrement", "blessure",
              "électrocution", "incendie", "risque", "immédiat", "menaçant", "très grave", "catastrophe",
              "haute", "dangereux", "mortel", "inondation grave"],
    "basse": ["mineur", "léger", "petit", "basse", "esthétique", "gêne", "minime", "peu important",
              "secondaire", "cosmétique", "négligeable"],
}

CAT_LABELS = {
    "voirie": "Voirie et routes",
    "eclairage_public": "Éclairage public",
    "assainissement": "Assainissement et eau",
    "nuisance_sonore": "Nuisance sonore",
    "urbanisme": "Urbanisme et construction",
    "administratif": "Affaires administratives",
    "autre": "Autre",
}

URG_LABELS = {"basse": "Basse", "moyenne": "Moyenne", "haute": "Haute"}

CONVERSATION_STEPS = {
    "start": {
        "question": "Bonjour ! Je suis l'assistant Plainte360. Je vais vous aider à déposer votre plainte. Pouvez-vous me décrire votre problème ?",
        "next": "location"
    },
    "location": {
        "question": "Merci pour ces détails. Pouvez-vous me préciser l'adresse ou la localisation exacte du problème ?",
        "next": "urgency"
    },
    "urgency": {
        "question": "D'accord. Quelle est la gravité selon vous ?\n- **Basse** : gêne mineure\n- **Moyenne** : problème notable\n- **Haute** : danger ou urgence",
        "next": "confirm"
    },
    "confirm": {
        "question": "Je comprends. Votre plainte est enregistrée. Vous recevrez une notification dès qu'un agent la prendra en charge.",
        "next": "done"
    }
}


def detect_category(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for category, keywords in CATEGORIES_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score
    if scores:
        return max(scores, key=scores.get)
    return "autre"


def detect_urgency(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in URGENCY_INDICATORS["haute"]):
        return "haute"
    elif any(w in text_lower for w in URGENCY_INDICATORS["basse"]):
        return "basse"
    return "moyenne"


def generate_titre(description: str, categorie: str) -> str:
    desc = description.strip()
    cat_label = CAT_LABELS.get(categorie, "Signalement")
    if len(desc) <= 5:
        return f"Signalement - {cat_label}"
    first_sentence = re.split(r'[.!?\n]', desc)[0].strip()
    if len(first_sentence) > 80:
        first_sentence = first_sentence[:77] + "..."
    if len(first_sentence) < 5:
        return f"Signalement - {cat_label}"
    return first_sentence[0].upper() + first_sentence[1:]


def generate_resume_ia(description: str, categorie: str, urgence: str, localisation: str) -> str:
    cat_label = CAT_LABELS.get(categorie, categorie)
    urg_label = URG_LABELS.get(urgence, urgence)
    desc_lower = description.lower()

    # Extract key elements from description
    problemes = []
    impacts = []
    durees = []

    # Detect duration mentions
    duration_patterns = [
        r'depuis\s+(\w+\s+\w+)', r'il y a\s+(\w+\s+\w+)',
        r'(\d+\s+(?:jour|semaine|mois|an)s?)', r'ça fait\s+(\w+\s+\w+)',
    ]
    for pattern in duration_patterns:
        match = re.search(pattern, desc_lower)
        if match:
            durees.append(match.group(1))

    # Detect impact keywords
    impact_words = {
        "sécurité": "risque pour la sécurité des citoyens",
        "danger": "situation dangereuse signalée",
        "enfant": "zone fréquentée par des enfants",
        "école": "proximité d'un établissement scolaire",
        "accident": "risque d'accident",
        "santé": "impact potentiel sur la santé publique",
        "odeur": "nuisances olfactives signalées",
        "inondation": "risque d'inondation",
        "obscurité": "problème de visibilité nocturne",
        "noir": "problème de visibilité nocturne",
        "nuit": "problème affectant la sécurité nocturne",
        "blessure": "risque de blessure pour les usagers",
        "circulation": "impact sur la circulation",
        "piéton": "sécurité des piétons concernée",
    }
    for word, impact in impact_words.items():
        if word in desc_lower:
            impacts.append(impact)

    # Build structured summary
    sections = []

    sections.append(f"📋 ANALYSE AUTOMATIQUE DE LA PLAINTE")
    sections.append(f"")
    sections.append(f"▸ Domaine : {cat_label}")
    sections.append(f"▸ Niveau d'urgence évalué : {urg_label}")
    if localisation:
        sections.append(f"▸ Lieu : {localisation}")
    if durees:
        sections.append(f"▸ Durée signalée : {durees[0]}")
    sections.append(f"")

    # Problem description
    desc_clean = description.strip()
    if len(desc_clean) > 300:
        desc_clean = desc_clean[:297] + "..."
    sections.append(f"▸ Description : {desc_clean}")

    # Impact assessment
    if impacts:
        sections.append(f"")
        sections.append(f"⚠️ Points d'attention :")
        for imp in impacts[:3]:
            sections.append(f"  • {imp}")

    # Recommendations based on category
    recommendations = {
        "voirie": "Intervention du service voirie recommandée. Vérifier l'état de la chaussée et planifier les réparations.",
        "eclairage_public": "Inspection par le service électrique municipal. Vérifier les installations d'éclairage concernées.",
        "assainissement": "Intervention du service d'assainissement. Inspection des canalisations et du réseau d'eau.",
        "nuisance_sonore": "Vérification par les services de proximité. Médiation possible avec la source de nuisance.",
        "urbanisme": "Vérification de conformité par le service d'urbanisme. Consulter les autorisations en vigueur.",
        "administratif": "Traitement par le service administratif compétent. Vérifier les pièces et documents requis.",
        "autre": "Orientation vers le service municipal compétent pour évaluation.",
    }
    sections.append(f"")
    sections.append(f"💡 Recommandation : {recommendations.get(categorie, recommendations['autre'])}")

    return "\n".join(sections)


# In-memory conversation state (per user session)
conversations: dict = {}


@router.post("/message", response_model=schemas.ChatResponse)
def chat_message(
    msg: schemas.ChatMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    text = msg.message.strip()

    if user_id not in conversations:
        conversations[user_id] = {"step": "start", "data": {}}

    conv = conversations[user_id]
    step = conv["step"]

    if step == "start":
        conv["data"]["description"] = text
        conv["data"]["categorie"] = detect_category(text)
        conv["data"]["titre"] = generate_titre(text, conv["data"]["categorie"])
        cat_label = CAT_LABELS.get(conv["data"]["categorie"], conv["data"]["categorie"])
        conv["step"] = "location"
        return schemas.ChatResponse(
            reply=f"J'ai bien noté votre signalement. J'ai détecté qu'il s'agit d'un problème de type **{cat_label}**.\n\n" + CONVERSATION_STEPS["location"]["question"],
            plainte_created=False
        )

    elif step == "location":
        conv["data"]["localisation"] = text
        conv["step"] = "urgency"
        return schemas.ChatResponse(
            reply=CONVERSATION_STEPS["urgency"]["question"],
            plainte_created=False
        )

    elif step == "urgency":
        conv["data"]["urgence"] = detect_urgency(text)
        conv["step"] = "confirm"

        # Create the plainte with intelligent summary
        description = conv["data"].get("description", "")
        categorie = conv["data"].get("categorie", "autre")
        localisation = conv["data"].get("localisation", "")
        resume = generate_resume_ia(description, categorie, conv["data"]["urgence"], localisation)

        plainte = models.Plainte(
            citoyen_id=current_user.id,
            titre=conv["data"].get("titre", "Plainte citoyenne"),
            description=description,
            categorie=categorie,
            urgence=conv["data"]["urgence"],
            localisation=localisation,
            statut="soumise",
            resume_ia=resume
        )
        db.add(plainte)
        db.commit()
        db.refresh(plainte)

        historique = models.Historique(
            plainte_id=plainte.id,
            user_id=current_user.id,
            action="Plainte soumise via chatbot",
            details=f"Catégorie: {plainte.categorie}, Urgence: {plainte.urgence}"
        )
        db.add(historique)
        db.commit()

        # Reset conversation
        del conversations[user_id]

        reply = (
            f"✅ Votre plainte a été enregistrée avec succès !\n\n"
            f"📋 **Numéro** : #{plainte.id}\n"
            f"📁 **Catégorie** : {CAT_LABELS.get(plainte.categorie, plainte.categorie)}\n"
            f"⚠️ **Urgence** : {URG_LABELS.get(plainte.urgence, plainte.urgence)}\n"
            f"📍 **Localisation** : {plainte.localisation}\n\n"
            f"Un agent sera notifié et prendra en charge votre plainte. "
            f"Vous pouvez suivre son avancement depuis votre tableau de bord."
        )

        return schemas.ChatResponse(
            reply=reply,
            plainte_id=plainte.id,
            plainte_created=True
        )

    # Default / reset
    conversations[user_id] = {"step": "start", "data": {}}
    return schemas.ChatResponse(
        reply=CONVERSATION_STEPS["start"]["question"],
        plainte_created=False
    )


@router.post("/reset")
def reset_conversation(current_user: models.User = Depends(get_current_user)):
    if current_user.id in conversations:
        del conversations[current_user.id]
    return {"message": "Conversation réinitialisée"}
