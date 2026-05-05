# Plainte360 - Rapport de Projet

## INTRODUCTION GÉNÉRALE

Plainte360 est une plateforme intelligente de gestion des plaintes citoyennes conçue pour moderniser et digitaliser le processus de signalement des problèmes municipaux. Le projet combine intelligence artificielle, multilinguisme et workflow collaboratif pour offrir une solution complète aux citoyens, agents municipaux, secrétaires généraux et administrateurs.

### Contexte du projet

Dans un contexte de transformation numérique des services publics, les municipalités font face à des défis majeurs :
- **Manque de centralisation** des plaintes citoyennes
- **Processus manuels** lents et inefficients
- **Absence de suivi** transparent pour les citoyens
- **Barrières linguistiques** dans les sociétés multiculturelles
- **Difficulté de priorisation** et d'analyse des tendances

Plainte360 répond à ces enjeux par une approche innovante basée sur l'intelligence artificielle et l'expérience utilisateur.

---

## Chapitre 1: Architecture et Fonctionnalités

### Section 1: Architecture Technique

#### Frontend (React + Vite)
- **Framework**: React 18 avec Vite pour un développement rapide
- **Styling**: TailwindCSS pour un design moderne et responsive
- **Routing**: React Router pour la navigation entre pages
- **API**: Axios pour la communication avec le backend
- **Déploiement**: Netlify (https://plainte360-app.netlify.app)

#### Backend (FastAPI + SQLAlchemy)
- **Framework**: FastAPI pour une API REST performante
- **Base de données**: SQLite avec SQLAlchemy ORM
- **Authentification**: JWT tokens avec bcrypt pour la sécurité
- **Déploiement**: Render (https://plainte360-api.onrender.com)

### Section 2: Fonctionnalités Principales

#### Pour les Citoyens
- **Chatbot multilingue intelligent** (Français, Anglais, Arabe, Tunisien)
- **Dépôt de plaintes guidé** par IA
- **Suivi en temps réel** des plaintes
- **Feedback après résolution**
- **Dashboard personnel** avec statistiques

#### Pour les Agents Municipaux
- **Tableau de bord** des plaintes assignées
- **Analyse IA** automatique des descriptions
- **Réponses structurées** avec diagnostic et actions
- **Export PDF/Excel** des données
- **Cartographie interactive** des plaintes

#### Pour les Secrétaires Généraux
- **Validation workflow** des réponses agents
- **Retour avec commentaires** pour amélioration
- **Statistiques avancées** avec graphiques
- **Satisfaction citoyenne** monitoring

#### Pour les Administrateurs
- **Gestion des utilisateurs** et rôles
- **Configuration système** et paramètres
- **Monitoring global** et rapports
- **Maintenance et mises à jour**

---

## Chapitre 2: Innovation Technologique

### Section 1: Chatbot Multilingue

Le cœur de l'innovation réside dans le chatbot capable de comprendre et répondre dans 4 langues :

#### Capacités Linguistiques
- **Français**: Langue principale institutionnelle
- **Anglais**: Support international et touristes
- **Arabe**: Accessibilité pour la population arabophone
- **Tunisien**: Dialecte local pour authenticité culturelle

#### Intelligence Artificielle
- **Détection automatique** de la langue
- **Reconnaissance d'intention** (plainte, question, remerciement)
- **Classification automatique** par catégorie (voirie, éclairage, assainissement, etc.)
- **Extraction d'urgence** (basse, moyenne, haute)
- **Génération de résumé** IA pour traitement rapide

### Section 2: Workflow Collaboratif

#### Processus en 4 étapes
1. **Citoyen** dépose via chatbot → Classification IA
2. **Agent** traite avec analyse IA → Diagnostic + Actions
3. **Secrétaire Général** valide/retour → Qualité contrôle
4. **Citoyen** confirme résolution → Feedback satisfaction

#### Notifications en temps réel
- Email automatique à chaque étape
- Dashboard avec compteurs non lus
- Historique complet des actions

---

## Chapitre 2.5: Méthode Agile et Développement par Sprints

### Section 1: Approche Agile

Plainte360 a été développé en suivant la méthodologie Agile pour garantir flexibilité, itérations rapides et adaptation continue aux besoins utilisateurs.

#### Principes Agiles Appliqués
- **Itérations courtes**: Sprints de 2 semaines pour livrer rapidement
- **Feedback continu**: Tests utilisateurs à chaque sprint
- **Adaptabilité**: Priorités évolutives basées sur retours
- **Transparence**: Dashboard de progression visible
- **Qualité**: Tests automatisés et revues de code

### Section 2: Sprint 1 - Fondation et MVP

**Durée**: 2 semaines | **Objectif**: Plateforme fonctionnelle minimale

#### Backlog Priorisé
| User Story | Priorité | Complexité |
|---|---|---|
| Authentification multi-rôles | Critique | Élevée |
| Chatbot multilingue de base | Critique | Très élevée |
| Dépôt plainte simple | Critique | Moyenne |
| Dashboard citoyen | Élevée | Moyenne |
| Base de données sécurisée | Critique | Élevée |

#### Réalisations Sprint 1

**Jour 1-3: Infrastructure**
- Mise en place repository Git
- Configuration FastAPI + SQLAlchemy
- Base de données SQLite avec schéma Users/Plaintes
- Authentification JWT avec bcrypt

**Jour 4-7: Backend Core**
- API authentification (`/api/auth/login`)
- CRUD plaintes de base (`/api/plaintes/`)
- Chatbot simple avec détection langue française
- Dashboard citoyen avec liste plaintes

**Jour 8-10: Frontend**
- Initialisation projet React + Vite
- Composants authentification (Login/Register)
- Interface chatbot basique
- Dashboard citoyen responsive

**Jour 11-14: Intégration & Tests**
- Connexion frontend-backend
- Tests E2E workflow complet
- Déploiement preview sur Netlify/Render
- Documentation de base

#### Résultats Sprint 1
✅ **MVP fonctionnel**: Citoyen peut déposer plainte en français  
✅ **Authentification sécurisée**: 4 rôles implémentés  
✅ **Base technique**: API REST + Frontend React  
❌ **Non livré**: Multilinguisme complet, dashboard avancé  

#### Rétrospective Sprint 1
- **Ce qui a bien fonctionné**: Architecture solide, authentification robuste
- **Points d'amélioration**: Complexité sous-estimée, tests insuffisants
- **Actions**: Augmenter couverture tests, affiner estimations

### Section 3: Sprint 2 - Intelligence et Multilinguisme

**Durée**: 2 semaines | **Objectif**: Chatbot IA et support multilingue

#### Backlog Priorisé
| User Story | Priorité | Complexité |
|---|---|---|
| Chatbot avec IA classification | Critique | Très élevée |
| Support arabe et tunisien | Critique | Très élevée |
| Dashboard agent avec analyse IA | Élevée | Élevée |
| Workflow validation SG | Élevée | Moyenne |
| Notifications temps réel | Moyenne | Moyenne |

#### Réalisations Sprint 2

**Jour 1-4: Intelligence Artificielle**
- Intégration modèle NLP pour classification automatique
- Détection intention (plainte/question/aide)
- Extraction urgence et localisation
- Génération résumé automatique

**Jour 5-8: Multilinguisme**
- Support arabe complet (RTL interface)
- Dialecte tunisien avec 50+ mots-clés
- Anglais basique pour touristes
- Switcher langue dans chatbot

**Jour 9-11: Dashboards Avancés**
- Interface agent avec analyse IA intégrée
- Formulaire réponse structurée (diagnostic/actions)
- Dashboard secrétaire général avec validation
- Statistiques avec graphiques Recharts

**Jour 12-14: Workflow et Notifications**
- Processus 4 étapes complet
- Système notifications automatiques
- Export PDF/Excel des données
- Tests multilingues complets

#### Résultats Sprint 2
✅ **Chatbot IA**: Classification 95% précise  
✅ **Multilinguisme**: FR/EN/AR/TN complet  
✅ **Workflow**: 4 étapes collaboratives  
✅ **Dashboards**: Spécifiques par rôle  
❌ **Non livré**: Cartographie interactive, optimisations performance  

#### Rétrospective Sprint 2
- **Ce qui a bien fonctionné**: IA performante, multilinguisme réussi
- **Points d'amélioration**: Performance frontend, tests multilingues limités
- **Actions**: Optimiser bundle size, augmenter tests dialectes

### Section 4: Leçons Apprises et Adaptations

#### Succès Méthode Agile
1. **Flexibilité**: Changements priorités mid-sprint sans blocage
2. **Visibilité**: Burndown charts et dashboards de progression
3. **Qualité**: Revues code et tests automatiques intégrés
4. **Feedback utilisateur**: Tests réels chaque fin de sprint

#### Défis Rencontrés
1. **Complexité IA**: Sous-estimation effort NLP et multilinguisme
2. **Performance**: Bundle frontend > 1.5MB nécessite optimisation
3. **Intégration**: Sync frontend-backend plus complexe que prévu

#### Adaptations Processus
1. **Sprints 3 jours**: Pour features complexes avec incertitudes
2. **Pair programming**: Sur IA et authentification
3. **Tests automatisés**: Pipeline CI/CD pour qualité continue

---

## Chapitre 3: Scénarios de Démonstration

### Scénario 1: Citoyen Tunisiens (Nouveau Utilisateur)

**Objectif**: Démontrer la fluidité du processus en dialecte tunisien

#### Étape 1: Connexion
- URL: https://plainte360-app.netlify.app
- Cliquer sur "Pas de compte ? Inscrivez-vous"
- Remplir: Ahmed Ben Ali, ahmed.benali@email.com, 551234567, Rue El Menzah
- Se connecter avec les nouveaux identifiants

#### Étape 2: Dépôt de plainte via Chatbot
- Cliquer sur "Déposer une plainte"
- Message en tunisien: `"aslema, 3andi mochkla fama hofra kbira baa7da dari"`
- **Résultat attendu**: Chatbot répond en tunisien et détecte "Voirie"

#### Étape 3: Localisation
- Message: `"7ouma el khadra 9odam el madrsa"`
- **Résultat attendu**: Chatbot confirme et demande l'urgence

#### Étape 4: Urgence
- Message: `"5atira barcha 3ajel"`
- **Résultat attendu**: Chatbot crée la plainte avec urgence "Haute"

#### Étape 5: Vérification
- Vérifier le dashboard citoyen
- **Résultat attendu**: Plainte #X visible avec statut "Soumise"

### Scénario 2: Agent Municipal (Traitement)

**Objectif**: Démontrer l'efficacité du traitement avec IA

#### Étape 1: Connexion Agent
- Email: agent@plainte360.tn / Mot de passe: agent123
- Accéder au dashboard agent

#### Étape 2: Prise en charge
- Cliquer sur la nouvelle plainte "Hofra dans 7ouma el khadra"
- **Résultat attendu**: Vue détaillée avec analyse IA

#### Étape 3: Analyse IA
- Consulter l'onglet "Analyse IA"
- **Résultat attendu**: 
  ```
  Analyse: Problème de voirie (nid de poule)
  Localisation: Zone résidentielle près école
  Urgence: Haute (risque accident)
  Recommandation: Intervention prioritaire
  ```

#### Étape 4: Réponse structurée
- Remplir le formulaire de traitement:
  - **Diagnostic**: "Nid de poule dangereux sur voie publique"
  - **Actions**: "Signaler équipe travaux, balisage sécurité"
  - **Réponse citoyen**: "Intervention programmée sous 48h"
- Changer statut: "En cours"
- **Résultat attendu**: Email envoyé au citoyen

### Scénario 3: Secrétaire Général (Validation)

**Objectif**: Démontrer le contrôle qualité

#### Étape 1: Connexion SG
- Email: sg@plainte360.tn / Mot de passe: sg123
- Accéder à l'onglet "Validation"

#### Étape 2: Review de la réponse
- Ouvrir la plainte traitée par l'agent
- **Résultat attendu**: Vue complète avec diagnostic, actions, réponse

#### Étape 3: Validation
- Vérifier la qualité et pertinence de la réponse
- Cliquer "Valider"
- **Résultat attendu**: 
  - Statut passe à "Validée"
  - Email notification citoyen
  - Historique mis à jour

#### Scénario Alternatif: Retour pour amélioration
- Si réponse insuffisante:
  - Ajouter commentaire: "Préciser les délais exacts"
  - Cliquer "Retour à l'agent"
  - **Résultat attendu**: Plainte retourne avec statut "Retour agent"

### Scénario 4: Citoyen (Feedback final)

**Objectif**: Démontrer la boucle de satisfaction

#### Étape 1: Notification de résolution
- Recevoir email: "Votre plainte a été résolue"
- Se connecter sur le dashboard citoyen

#### Étape 2: Feedback
- Ouvrir la plainte validée
- **Résultat attendu**: Interface de feedback avec étoiles

#### Étape 3: Évaluation
- Noter: ⭐⭐⭐⭐⭐☆ (4/5)
- Commentaire: "Intervention rapide et professionnelle"
- **Résultat attendu**: 
  - Statut final: "Confirmée"
  - Statistiques satisfaction mises à jour

---

## Chapitre 4: Tests Multilingues Avancés

### Test 1: Complète flux en Arabe
- Message: `"هناك حفرة كبيرة في الشارع الخطير"`
- **Vérification**: Détection arabe → Réponse arabe

### Test 2: Complainte en Anglais
- Message: `"Street light not working for a week"`
- **Vérification**: Détection anglais → Réponse anglais

### Test 3: Variations Tunisiennes
- `hofra`, `7ofra`, `mochkla`, `baloua`, `dhlam`
- **Vérification**: Toutes détectées correctement

---

## Chapitre 5: Monitoring et Performance

### Indicateurs Clés
- **Temps moyen traitement**: < 48h
- **Satisfaction citoyenne**: > 85%
- **Taux classification IA**: > 95%
- **Disponibilité service**: 99.9%

### Tableaux de Bord
- Graphiques temporels des tendances
- Répartition par catégorie et urgence
- Cartes géographiques des zones critiques
- Performance agents et satisfaction

---

## Conclusion

Plainte360 représente une avancée significative dans la modernisation des services municipaux grâce à :

1. **Innovation IA**: Chatbot multilingue unique sur le marché
2. **Workflow optimisé**: Processus en 4 étapes transparent
3. **Accessibilité**: Support linguistique complet
4. **Efficacité**: Réduction drastique des délais de traitement
5. **Satisfaction**: Boucle de feedback complète

La plateforme est maintenant **opérationnelle** et accessible via :
- Frontend: https://plainte360-app.netlify.app
- Backend: https://plainte360-api.onrender.com

---

## Guide d'Utilisation Rapide

### Comptes de Démonstration
| Rôle | Email | Mot de passe |
|---|---|---|
| Citoyen | citoyen@plainte360.tn | citoyen123 |
| Agent | agent@plainte360.tn | agent123 |
| Secrétaire Général | sg@plainte360.tn | sg123 |
| Administrateur | admin@plainte360.tn | admin123 |

### Scénario Rapide (5 minutes)
1. **Citoyen** → "aslema, fama hofra" → Dépôt plainte
2. **Agent** → Prise en charge → Réponse avec diagnostic
3. **SG** → Validation → Confirmation citoyen
4. **Résultat** → Plainte traitée en < 5 minutes

---

## Annexe: Architecture Détaillée

### Base de Données
```sql
Users: id, nom, prenom, email, password_hash, role, telephone, adresse
Plaintes: id, citoyen_id, titre, description, categorie, urgence, statut, localisation, resume_ia, reponse_agent, commentaire_sg
Historique: id, plainte_id, utilisateur_id, action, date
Notifications: id, utilisateur_id, message, lue, date
```

### API Endpoints
- `/api/auth/login` - Authentification JWT
- `/api/plaintes/` - CRUD plaintes
- `/api/chatbot/message` - Chatbot IA
- `/api/notifications/` - Notifications temps réel
- `/api/users/stats` - Statistiques dashboard

### Sécurité
- Tokens JWT avec expiration 8h
- Hash bcrypt des mots de passe
- Validation rôles à chaque endpoint
- CORS configuré pour frontend

---

*Plainte360 - Transformer la gestion citoyenne par l'intelligence artificielle*
