from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas
import re
import os
import uuid
import base64

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# ─────────────────────────────────────────────────────────
# MULTILINGUAL KEYWORD DATABASE (FR / EN / AR / TUNISIAN)
# ─────────────────────────────────────────────────────────

CATEGORIES_KEYWORDS = {
    "voirie": [
        # French
        "route", "trottoir", "chaussée", "nid de poule", "bitume", "goudron", "voirie", "rue",
        "passage", "carrefour", "pont", "chemin", "avenue", "boulevard", "asphalte", "rond-point",
        # English
        "road", "street", "pothole", "sidewalk", "pavement", "highway", "asphalt", "crossroad",
        "bridge", "path", "avenue", "intersection", "crack", "broken road",
        # Arabic
        "طريق", "شارع", "رصيف", "حفرة", "جسر", "طرقات", "ممر", "تقاطع", "إسفلت",
        "حفر", "طريق مكسور", "مفترق",
        # Tunisian (all variants)
        "triq", "trottwar", "7ofra", "hofra", "7ofr", "chare3", "route meksra", "trotwer",
        "trotoar", "hfar", "trig", "char3", "7afra", "hafra", "meksra", "meksri",
        "zanqa", "zan9a", "nhaj", "n7aj", "tro9", "goudron", "godron",
        "trou", "7fira", "mkassra", "m9assra", "rass triq", "ras trig",
    ],
    "eclairage_public": [
        # French
        "lampadaire", "éclairage", "lumière", "lampe", "nuit", "noir", "eclairage", "sombre",
        "obscurité", "ampoule", "poteau électrique", "lampadaires", "lumières",
        # English
        "streetlight", "lamp", "light", "dark", "darkness", "lighting", "night", "blackout",
        "bulb", "street light", "public lighting",
        # Arabic
        "إنارة", "ضوء", "مصباح", "ظلام", "عمود", "ليل", "مظلم", "كهرباء", "أضواء", "لمبة",
        # Tunisian (all variants)
        "dhaw", "daw", "lampa", "lamba", "dhlam", "nwar", "lil", "9ot",
        "9otba", "dhlem", "lampader", "nour", "dhlom", "dlem",
        "me5lou3", "makhloua", "matfi", "matfiya", "tfi", "tfit",
        "lampat", "dawwar", "3amoud", "3amoud dhaw",
    ],
    "assainissement": [
        # French
        "égout", "eau", "inondation", "canalisation", "assainissement", "fuite", "débouchage",
        "boue", "stagnante", "odeur", "drainage", "tuyau", "robinet", "eaux usées", "fosse",
        # English
        "sewer", "water", "flood", "pipe", "drain", "leak", "mud", "stagnant", "smell",
        "drainage", "tap", "wastewater", "sewage", "plumbing",
        # Arabic
        "مجاري", "ماء", "فيضان", "أنابيب", "تسرب", "مياه", "وحل", "رائحة", "صرف",
        "حنفية", "مياه راكدة", "صرف صحي", "بالوعة",
        # Tunisian (all variants)
        "mayya", "tassrib", "fayadan", "ri7a", "egout",
        "baloua", "tuyau", "robine", "ma reke", "wassekh",
        "ma yousel", "ma ma9tou3", "ma yekhrej", "majeri", "mejri",
        "5arba", "kharba", "tassarob", "t9atter", "7anafiya",
        "ma yossal", "wse5", "zbelya", "zbal",
    ],
    "nuisance_sonore": [
        # French
        "bruit", "nuisance", "sonore", "musique", "tapage", "vacarme", "klaxon",
        "travaux bruyants", "voisin", "discothèque", "café", "fort", "bruyant",
        # English
        "noise", "loud", "music", "honking", "disturbance", "noisy", "neighbor",
        "sound", "nightclub", "bar", "party",
        # Arabic
        "ضجيج", "إزعاج", "صوت", "موسيقى", "ضوضاء", "جار", "عالي", "مقهى",
        # Tunisian (all variants)
        "3aja", "brui", "sot", "9ahwa", "jar", "musica", "disco",
        "z3ij", "iz3aj", "chahya", "sa7eb", "doj", "da3wa",
        "3ayyet", "7ess", "d9di9", "klakson", "soirya", "fete",
    ],
    "urbanisme": [
        # French
        "construction", "bâtiment", "permis", "urbanisme", "immeuble", "terrain",
        "clôture", "mur", "façade", "démolition", "chantier", "bâtisse",
        # English
        "construction", "building", "permit", "demolition", "fence", "wall",
        "facade", "site", "housing", "structure",
        # Arabic
        "بناء", "عمارة", "رخصة", "هدم", "سور", "جدار", "واجهة", "ورشة", "أرض", "بنايات",
        # Tunisian (all variants)
        "bina", "3mara", "rokhsa", "7it", "chantye", "demolision",
        "binaya", "ard", "bni", "hadm", "hdam",
        "chantier", "7out", "sowar", "jdar", "bne", "yebni",
    ],
    "administratif": [
        # French
        "document", "certificat", "attestation", "administratif", "papier", "formulaire",
        "acte", "inscription", "dossier", "extrait", "état civil", "identité",
        # English
        "document", "certificate", "form", "registration", "paperwork", "ID",
        "civil status", "identity", "birth certificate", "administrative",
        # Arabic
        "وثيقة", "شهادة", "تسجيل", "ملف", "إدارة", "هوية", "حالة مدنية", "استمارة",
        "وثائق", "أوراق",
        # Tunisian (all variants)
        "warqa", "chahada", "dossye", "papier", "carte", "fichya",
        "war9a", "watha9a", "mairie", "baladiya",
        "tasji", "tasjil", "3ard 7al", "extray", "wara9",
    ],
}

URGENCY_INDICATORS = {
    "haute": [
        # French
        "danger", "urgent", "grave", "urgence", "critique", "accident", "effondrement",
        "blessure", "électrocution", "incendie", "risque", "immédiat", "menaçant",
        "très grave", "catastrophe", "dangereux", "mortel", "inondation grave",
        # English
        "danger", "urgent", "serious", "critical", "accident", "collapse", "injury",
        "fire", "risk", "immediate", "threatening", "catastrophe", "deadly", "emergency",
        # Arabic
        "خطر", "عاجل", "خطير", "كارثة", "حادث", "انهيار", "حريق", "طوارئ", "فوري", "مهدد",
        # Tunisian
        "5atar", "khatar", "3ajel", "5atir", "khatir", "7ri9", "7adtha", "karetha",
        "tehdem", "khesr", "danger", "grav",
    ],
    "basse": [
        # French
        "mineur", "léger", "petit", "esthétique", "gêne", "minime", "peu important",
        "secondaire", "cosmétique", "négligeable",
        # English
        "minor", "small", "slight", "cosmetic", "negligible", "low", "not urgent",
        # Arabic
        "بسيط", "صغير", "هين", "خفيف", "غير مهم",
        # Tunisian
        "bsit", "sghir", "khfif", "mch mohim", "3adi",
    ],
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


# ─────────────────────────────────────────────────────────
# LANGUAGE DETECTION
# ─────────────────────────────────────────────────────────

def detect_language(text: str) -> str:
    """Detect language: 'ar' for Arabic, 'en' for English, 'tn' for Tunisian, 'fr' for French"""
    # Arabic script detection
    arabic_chars = len(re.findall(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]', text))
    if arabic_chars > len(text) * 0.3:
        return "ar"

    text_lower = text.lower()

    # Tunisian dialect markers (Latin script)
    tunisian_markers = [
        # Common words
        "ya5i", "ya5y", "3andna", "3andi", "7aja", "mech", "mch", "famma",
        "barcha", "bch", "w9ath", "yal", "win", "winou", "chkoun",
        "chnowa", "3lech", "kifech", "hethi", "hethia", "hedhi", "hedhia",
        "5ater", "9al", "9olt", "7keyet", "7kaya", "ija", "bahi",
        "labas", "yezzi", "5ouya", "sa7bi", "najem", "yatla3",
        "9odam", "wra", "hna", "tawa", "emchi", "nebda", "n7eb",
        "kol", "3bed", "bled", "7ouma", "houma", "dari", "5edma",
        "baba", "ommi", "walahi", "inchallah", "mashallah", "3ayech", "n3ich",
        # Problem-related
        "mochkla", "mouchkla", "mochkil", "mouchkil", "mochkol",
        "moshkla", "mushkla", "mushkil", "moshkil",
        "triq", "char3", "7ofra", "hofra", "baloua", "dhlam", "ri7a", "3aja",
        "9ahwa", "z3ij", "wassekh", "warqa", "robine", "lampader",
        "maysalahch", "mahich", "mouch", "9rib", "b3id", "mta3",
        # Location
        "9odam", "baa7da", "ba7dha", "ba7da", "7dha", "hdha", "jnab",
        "f", "fi", "mel", "mta3i", "mta3na",
        # Greetings / thanks
        "aslema", "aselma", "asslema", "asselma", "slema",
        "aaychek", "3aychek", "aychek", "3aychik", "aaychik", "y3aychek",
    ]
    tn_score = sum(1 for w in tunisian_markers if w in text_lower.split() or w in text_lower)

    # English markers
    english_markers = [
        "the", "is", "are", "was", "were", "have", "has", "there", "this",
        "that", "with", "for", "not", "but", "and", "from", "they", "been",
        "would", "could", "should", "will", "can", "about", "please", "help",
        "problem", "issue", "complaint", "report", "need", "want", "broken",
        "my", "our", "your", "near", "since", "because",
    ]
    en_score = sum(1 for w in english_markers if w in text_lower.split())

    if tn_score >= 2:
        return "tn"
    if en_score >= 2:
        return "en"
    if tn_score == 1 and en_score == 0:
        return "tn"
    return "fr"


# ─────────────────────────────────────────────────────────
# MULTILINGUAL RESPONSE TEMPLATES
# ─────────────────────────────────────────────────────────

GREETINGS = {
    "fr": "Bonjour ! Je suis l'assistant intelligent **Plainte360**. 🤖\nJe comprends le **français**, **l'anglais**, **l'arabe** et le **dialecte tunisien**.\n\nComment puis-je vous aider ? Décrivez-moi votre problème.",
    "en": "Hello! I'm the **Plainte360** smart assistant. 🤖\nI understand **French**, **English**, **Arabic** and **Tunisian dialect**.\n\nHow can I help you? Please describe your problem.",
    "ar": "مرحبا! أنا المساعد الذكي **Plainte360**. 🤖\nأفهم **الفرنسية** و**الإنجليزية** و**العربية** و**اللهجة التونسية**.\n\nكيف يمكنني مساعدتك؟ صف لي مشكلتك.",
    "tn": "أهلا! أنا المساعد الذكي **Plainte360**. 🤖\nنفهم **بالفرنسي** و**بالإنجليزي** و**بالعربي** و**بالتونسي**.\n\nقولي شنوا المشكلة متاعك؟",
}

MSGS = {
    "detected_category": {
        "fr": "J'ai bien compris votre problème. J'ai identifié qu'il s'agit de : **{cat}**.\n\n📍 Pouvez-vous me donner l'adresse ou la localisation exacte du problème ?",
        "en": "I understood your problem. I identified it as: **{cat}**.\n\n📍 Can you give me the exact address or location of the problem?",
        "ar": "فهمت مشكلتك. حددت أنها تتعلق بـ: **{cat}**.\n\n📍 هل يمكنك إعطائي العنوان أو الموقع الدقيق للمشكلة؟",
        "tn": "فهمتك. المشكلة متاعك تتعلق بـ: **{cat}**.\n\n📍 وينها بالضبط؟ أعطيني العنوان ولا البلاصة.",
    },
    "ask_urgency": {
        "fr": "Merci pour la localisation. Quel est le niveau de gravité ?\n\n🟢 **Basse** — gêne mineure\n🟡 **Moyenne** — problème notable\n🔴 **Haute** — danger ou urgence",
        "en": "Thanks for the location. What's the severity level?\n\n🟢 **Low** — minor inconvenience\n🟡 **Medium** — notable problem\n🔴 **High** — danger or emergency",
        "ar": "شكرا على الموقع. ما مستوى الخطورة؟\n\n🟢 **منخفضة** — إزعاج بسيط\n🟡 **متوسطة** — مشكلة ملحوظة\n🔴 **عالية** — خطر أو طوارئ",
        "tn": "شكرا على البلاصة. قداش الخطورة؟\n\n🟢 **خفيفة** — حاجة بسيطة\n🟡 **متوسطة** — مشكلة واضحة\n🔴 **عالية** — خطر ولا طوارئ",
    },
    "plainte_created": {
        "fr": (
            "✅ Votre plainte a été enregistrée avec succès !\n\n"
            "📋 **Numéro** : #{id}\n"
            "📁 **Catégorie** : {cat}\n"
            "⚠️ **Urgence** : {urg}\n"
            "📍 **Localisation** : {loc}\n\n"
            "Un agent sera notifié et prendra en charge votre plainte. "
            "Vous pouvez suivre son avancement depuis votre tableau de bord.\n\n"
            "💬 Besoin d'autre chose ? Décrivez un nouveau problème ou tapez **aide**."
        ),
        "en": (
            "✅ Your complaint has been successfully registered!\n\n"
            "📋 **Number**: #{id}\n"
            "📁 **Category**: {cat}\n"
            "⚠️ **Urgency**: {urg}\n"
            "📍 **Location**: {loc}\n\n"
            "An agent will be notified and will handle your complaint. "
            "You can track its progress from your dashboard.\n\n"
            "💬 Need anything else? Describe a new problem or type **help**."
        ),
        "ar": (
            "✅ تم تسجيل شكواك بنجاح!\n\n"
            "📋 **الرقم** : #{id}\n"
            "📁 **الفئة** : {cat}\n"
            "⚠️ **الاستعجال** : {urg}\n"
            "📍 **الموقع** : {loc}\n\n"
            "سيتم إخطار عون وسيتولى معالجة شكواك. "
            "يمكنك متابعة تقدمها من لوحة التحكم.\n\n"
            "💬 تحتاج شيء آخر؟ صف مشكلة جديدة أو اكتب **مساعدة**."
        ),
        "tn": (
            "✅ الشكوى متاعك تسجلت بنجاح!\n\n"
            "📋 **النمرة** : #{id}\n"
            "📁 **النوع** : {cat}\n"
            "⚠️ **الخطورة** : {urg}\n"
            "📍 **البلاصة** : {loc}\n\n"
            "عون باش يتصل بيك ويتكفل بالشكوى. "
            "تنجم تتبع التقدم من لوحة التحكم.\n\n"
            "💬 تحب حاجة أخرى؟ قولي مشكلة جديدة ولا اكتب **مساعدة**."
        ),
    },
    "help": {
        "fr": (
            "🆘 **Aide — Chatbot Plainte360**\n\n"
            "Je peux vous aider à :\n"
            "• **Déposer une plainte** — décrivez simplement votre problème\n"
            "• **Suivre vos plaintes** — consultez votre tableau de bord\n"
            "• **Connaître les catégories** — tapez **catégories**\n\n"
            "Je comprends le français, l'anglais, l'arabe et le tunisien.\n"
            "Écrivez dans la langue qui vous convient ! 🌍"
        ),
        "en": (
            "🆘 **Help — Plainte360 Chatbot**\n\n"
            "I can help you:\n"
            "• **File a complaint** — just describe your problem\n"
            "• **Track your complaints** — check your dashboard\n"
            "• **Know categories** — type **categories**\n\n"
            "I understand French, English, Arabic and Tunisian.\n"
            "Write in the language you prefer! 🌍"
        ),
        "ar": (
            "🆘 **مساعدة — شاتبوت Plainte360**\n\n"
            "يمكنني مساعدتك في:\n"
            "• **تقديم شكوى** — صف مشكلتك ببساطة\n"
            "• **متابعة شكاواك** — راجع لوحة التحكم\n"
            "• **معرفة الفئات** — اكتب **الفئات**\n\n"
            "أفهم الفرنسية والإنجليزية والعربية والتونسية.\n"
            "اكتب باللغة التي تناسبك! 🌍"
        ),
        "tn": (
            "🆘 **مساعدة — شاتبوت Plainte360**\n\n"
            "ننجم نعاونك في:\n"
            "• **تعمل شكوى** — قولي المشكلة متاعك\n"
            "• **تتبع الشكاوي** — شوف لوحة التحكم\n"
            "• **تعرف الأنواع** — اكتب **الأنواع**\n\n"
            "نفهم فرنسي، إنجليزي، عربي وتونسي.\n"
            "اكتب بأي لغة تحبها! 🌍"
        ),
    },
    "categories": {
        "fr": (
            "📂 **Catégories disponibles :**\n\n"
            "🛣️ **Voirie** — routes, trottoirs, nids de poule\n"
            "💡 **Éclairage public** — lampadaires, obscurité\n"
            "💧 **Assainissement** — eau, égouts, fuites\n"
            "🔊 **Nuisance sonore** — bruit, tapage\n"
            "🏗️ **Urbanisme** — constructions, permis\n"
            "📋 **Administratif** — documents, certificats\n\n"
            "Décrivez votre problème et je détecterai automatiquement la catégorie."
        ),
        "en": (
            "📂 **Available categories:**\n\n"
            "🛣️ **Roads** — streets, sidewalks, potholes\n"
            "💡 **Public lighting** — streetlights, darkness\n"
            "💧 **Sanitation** — water, sewers, leaks\n"
            "🔊 **Noise** — disturbance, loud sounds\n"
            "🏗️ **Urban planning** — construction, permits\n"
            "📋 **Administrative** — documents, certificates\n\n"
            "Describe your problem and I'll automatically detect the category."
        ),
        "ar": (
            "📂 **الفئات المتاحة:**\n\n"
            "🛣️ **الطرقات** — شوارع، أرصفة، حفر\n"
            "💡 **الإنارة العمومية** — مصابيح، ظلام\n"
            "💧 **الصرف الصحي** — مياه، مجاري، تسرب\n"
            "🔊 **الضجيج** — إزعاج، أصوات عالية\n"
            "🏗️ **العمران** — بناء، رخص\n"
            "📋 **الإداري** — وثائق، شهادات\n\n"
            "صف مشكلتك وسأحدد الفئة تلقائيا."
        ),
        "tn": (
            "📂 **الأنواع الموجودة:**\n\n"
            "🛣️ **الطرقات** — شوارع، تروتوار، حفر\n"
            "💡 **الضو** — لمبادير، ظلام\n"
            "💧 **الماء والصرف** — ماء، بالوعة، تسريب\n"
            "🔊 **العجة** — إزعاج، ضجيج\n"
            "🏗️ **البناء** — عمارات، رخص\n"
            "📋 **الإداري** — أوراق، شهادات\n\n"
            "قولي المشكلة ونحدد النوع وحدي."
        ),
    },
    "unknown": {
        "fr": "Je n'ai pas bien compris. Pouvez-vous décrire votre problème plus en détail ? Ou tapez **aide** pour voir ce que je peux faire.",
        "en": "I didn't quite understand. Could you describe your problem in more detail? Or type **help** to see what I can do.",
        "ar": "لم أفهم جيدا. هل يمكنك وصف مشكلتك بمزيد من التفصيل؟ أو اكتب **مساعدة** لمعرفة ما يمكنني فعله.",
        "tn": "ما فهمتش مليح. تنجم تفسرلي أكثر؟ ولا اكتب **مساعدة** باش نقولك شنوا ننجم نعمل.",
    },
}


# ─────────────────────────────────────────────────────────
# GREETING / HELP / CATEGORIES DETECTION
# ─────────────────────────────────────────────────────────

GREETING_WORDS = [
    "bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "hey", "good morning",
    "good evening", "مرحبا", "السلام", "سلام", "أهلا", "صباح الخير", "مساء الخير",
    "a5er", "ahla", "salam", "bsr", "bjr", "alo",
    "aslema", "aselma", "aslama", "asslema", "asselma", "slema",
]

THANKS_WORDS = [
    # French
    "merci", "remercie", "thanks", "thank you", "thank",
    # Arabic
    "شكرا", "بارك الله",
    # Tunisian
    "aaychek", "3aychek", "aychek", "3aychik", "aaychik", "aychik",
    "ya3tik", "ya3tik essa7a", "y3aychek", "y3aychik",
    "3ayshek", "3ayshik", "baraka", "barakallah",
]

HELP_WORDS = [
    "aide", "help", "مساعدة", "comment", "how", "كيف", "kifech", "chnowa",
    "3awni", "aidez", "assist", "guide",
]

CATEGORIES_WORDS = [
    "catégorie", "categories", "catégories", "category", "الفئات", "الأنواع",
    "anwe3", "catégori", "types", "type",
]

STATUS_WORDS = [
    "suivi", "status", "état", "follow", "track", "حالة", "متابعة", "تتبع",
    "7alet", "tataba3", "winou", "win",
]


# ─────────────────────────────────────────────────────────
# CORE NLP FUNCTIONS
# ─────────────────────────────────────────────────────────

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


def detect_intent(text: str) -> str:
    """Detect the user's intent from their message"""
    text_lower = text.lower().strip()

    if any(w in text_lower for w in GREETING_WORDS) and len(text_lower.split()) <= 4:
        return "greeting"
    if any(w in text_lower for w in THANKS_WORDS):
        return "thanks"
    if any(w in text_lower for w in HELP_WORDS):
        return "help"
    if any(w in text_lower for w in CATEGORIES_WORDS):
        return "categories"
    if any(w in text_lower for w in STATUS_WORDS) and len(text_lower.split()) <= 5:
        return "status"

    return "complaint"


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

    problemes = []
    impacts = []
    durees = []

    duration_patterns = [
        r'depuis\s+(\w+\s+\w+)', r'il y a\s+(\w+\s+\w+)',
        r'(\d+\s+(?:jour|semaine|mois|an)s?)', r'ça fait\s+(\w+\s+\w+)',
        r'since\s+(\w+\s+\w+)', r'for\s+(\d+\s+\w+)',
        r'من\s+(\w+\s+\w+)', r'منذ\s+(\w+)',
    ]
    for pattern in duration_patterns:
        match = re.search(pattern, desc_lower)
        if match:
            durees.append(match.group(1))

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
        "children": "area frequented by children",
        "school": "proximity to school",
        "fire": "fire risk reported",
        "أطفال": "منطقة يرتادها أطفال",
        "خطر": "حالة خطرة",
        "حريق": "خطر حريق",
    }
    for word, impact in impact_words.items():
        if word in desc_lower:
            impacts.append(impact)

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

    desc_clean = description.strip()
    if len(desc_clean) > 300:
        desc_clean = desc_clean[:297] + "..."
    sections.append(f"▸ Description : {desc_clean}")

    if impacts:
        sections.append(f"")
        sections.append(f"⚠️ Points d'attention :")
        for imp in impacts[:3]:
            sections.append(f"  • {imp}")

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


# ─────────────────────────────────────────────────────────
# CONVERSATION ENGINE
# ─────────────────────────────────────────────────────────

conversations: dict = {}


@router.post("/message", response_model=schemas.ChatResponse)
def chat_message(
    msg: schemas.ChatMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    text = msg.message.strip()
    lang = detect_language(text)

    if user_id not in conversations:
        conversations[user_id] = {"step": "idle", "data": {}, "lang": lang}

    conv = conversations[user_id]
    # Update language if detected with confidence
    if lang != "fr" or conv.get("lang") == "fr":
        conv["lang"] = lang
    lang = conv["lang"]

    step = conv["step"]

    # ── IDLE STATE: detect intent ──
    if step == "idle":
        intent = detect_intent(text)

        if intent == "greeting":
            return schemas.ChatResponse(reply=GREETINGS[lang], plainte_created=False)

        if intent == "thanks":
            thanks_msgs = {
                "fr": "De rien ! 😊 C'est un plaisir de vous aider.\n\nBesoin d'autre chose ? Décrivez un nouveau problème ou tapez **aide**.",
                "en": "You're welcome! 😊 Happy to help.\n\nNeed anything else? Describe a new problem or type **help**.",
                "ar": "عفوا! 😊 سعيد بمساعدتك.\n\nتحتاج شيء آخر؟ صف مشكلة جديدة أو اكتب **مساعدة**.",
                "tn": "عيشك! 😊 فرحان إلي عاونتك.\n\nتحب حاجة أخرى؟ قولي مشكلة جديدة ولا اكتب **مساعدة**.",
            }
            return schemas.ChatResponse(reply=thanks_msgs[lang], plainte_created=False)

        if intent == "help":
            return schemas.ChatResponse(reply=MSGS["help"][lang], plainte_created=False)

        if intent == "categories":
            return schemas.ChatResponse(reply=MSGS["categories"][lang], plainte_created=False)

        if intent == "status":
            # Count user's plaintes
            total = db.query(models.Plainte).filter(models.Plainte.citoyen_id == current_user.id).count()
            en_cours = db.query(models.Plainte).filter(
                models.Plainte.citoyen_id == current_user.id,
                models.Plainte.statut.in_(["soumise", "en_cours", "traitee"])
            ).count()
            status_msgs = {
                "fr": f"📊 Vous avez **{total}** plainte(s) au total, dont **{en_cours}** en cours de traitement.\n\nConsultez votre tableau de bord pour plus de détails.",
                "en": f"📊 You have **{total}** complaint(s) in total, with **{en_cours}** being processed.\n\nCheck your dashboard for more details.",
                "ar": f"📊 لديك **{total}** شكوى/شكاوى, منها **{en_cours}** قيد المعالجة.\n\nراجع لوحة التحكم لمزيد من التفاصيل.",
                "tn": f"📊 عندك **{total}** شكوى/شكاوي, منهم **{en_cours}** يتعالجوا.\n\nشوف لوحة التحكم للتفاصيل.",
            }
            return schemas.ChatResponse(reply=status_msgs[lang], plainte_created=False)

        # Default: treat as complaint description
        if len(text) < 5:
            return schemas.ChatResponse(reply=MSGS["unknown"][lang], plainte_created=False)

        conv["data"]["description"] = text
        conv["data"]["categorie"] = detect_category(text)
        conv["data"]["titre"] = generate_titre(text, conv["data"]["categorie"])
        cat_label = CAT_LABELS.get(conv["data"]["categorie"], conv["data"]["categorie"])
        conv["step"] = "location"

        return schemas.ChatResponse(
            reply=MSGS["detected_category"][lang].format(cat=cat_label),
            plainte_created=False,
        )

    # ── LOCATION STATE ──
    elif step == "location":
        conv["data"]["localisation"] = text
        # Save GPS coords if sent with this message
        if msg.latitude and msg.longitude:
            conv["data"]["latitude"] = msg.latitude
            conv["data"]["longitude"] = msg.longitude
        # Save photo if sent
        if msg.photo_base64:
            photo_path = save_photo_base64(msg.photo_base64)
            if photo_path:
                conv["data"]["photo_url"] = photo_path
        conv["step"] = "urgency"
        return schemas.ChatResponse(
            reply=MSGS["ask_urgency"][lang],
            plainte_created=False,
        )

    # ── URGENCY STATE → create plainte ──
    elif step == "urgency":
        conv["data"]["urgence"] = detect_urgency(text)

        description = conv["data"].get("description", "")
        categorie = conv["data"].get("categorie", "autre")
        localisation = conv["data"].get("localisation", "")
        urgence = conv["data"]["urgence"]
        resume = generate_resume_ia(description, categorie, urgence, localisation)

        plainte = models.Plainte(
            citoyen_id=current_user.id,
            titre=conv["data"].get("titre", "Plainte citoyenne"),
            description=description,
            categorie=categorie,
            urgence=urgence,
            localisation=localisation,
            latitude=conv["data"].get("latitude"),
            longitude=conv["data"].get("longitude"),
            photo_url=conv["data"].get("photo_url"),
            statut="soumise",
            resume_ia=resume,
        )
        db.add(plainte)
        db.commit()
        db.refresh(plainte)

        historique = models.Historique(
            plainte_id=plainte.id,
            user_id=current_user.id,
            action="Plainte soumise via chatbot",
            details=f"Catégorie: {plainte.categorie}, Urgence: {plainte.urgence}, Langue: {lang}",
        )
        db.add(historique)
        db.commit()

        # Reset conversation to idle (ready for next)
        conversations[user_id] = {"step": "idle", "data": {}, "lang": lang}

        reply = MSGS["plainte_created"][lang].format(
            id=plainte.id,
            cat=CAT_LABELS.get(plainte.categorie, plainte.categorie),
            urg=URG_LABELS.get(plainte.urgence, plainte.urgence),
            loc=plainte.localisation,
        )
        return schemas.ChatResponse(reply=reply, plainte_id=plainte.id, plainte_created=True)

    # ── FALLBACK ──
    conversations[user_id] = {"step": "idle", "data": {}, "lang": lang}
    return schemas.ChatResponse(reply=GREETINGS[lang], plainte_created=False)


# ─── PHOTO UPLOAD ───
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_photo_base64(base64_data: str) -> str:
    """Save base64 photo and return relative path"""
    try:
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
        img_data = base64.b64decode(base64_data)
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(img_data)
        return f"/api/chatbot/uploads/{filename}"
    except Exception:
        return None


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return {"photo_url": f"/api/chatbot/uploads/{filename}"}


@router.get("/uploads/{filename}")
def serve_upload(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(filepath)


@router.post("/reset")
def reset_conversation(current_user: models.User = Depends(get_current_user)):
    if current_user.id in conversations:
        del conversations[current_user.id]
    return {"message": "Conversation réinitialisée"}
