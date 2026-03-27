import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  HelpCircle, MessageSquare, FileText, CheckCircle, Users,
  ChevronRight, ArrowLeft, Shield, BarChart3, Brain, Send,
  ThumbsUp, AlertTriangle, RotateCcw, Wrench, Clock, Play
} from 'lucide-react';

const GUIDES = {
  citoyen: {
    title: 'Guide du Citoyen',
    subtitle: 'Comment utiliser Plainte360 pour déposer et suivre vos réclamations',
    sections: [
      {
        id: 'deposer',
        icon: MessageSquare,
        title: 'Déposer une plainte',
        color: 'blue',
        steps: [
          { icon: MessageSquare, text: 'Allez dans "Déposer une plainte" depuis le menu à gauche.' },
          { icon: Send, text: 'Le chatbot vous guidera étape par étape : décrivez votre problème en détail.' },
          { icon: Brain, text: "L'IA détectera automatiquement la catégorie (voirie, éclairage, assainissement...)." },
          { icon: FileText, text: 'Précisez la localisation exacte (adresse, quartier, repères).' },
          { icon: AlertTriangle, text: "Indiquez le niveau d'urgence : Basse, Moyenne ou Haute." },
          { icon: CheckCircle, text: 'Votre plainte sera enregistrée avec un numéro de suivi unique.' },
        ],
      },
      {
        id: 'suivre',
        icon: Clock,
        title: 'Suivre mes plaintes',
        color: 'green',
        steps: [
          { icon: FileText, text: 'Allez dans "Mes plaintes" pour voir toutes vos réclamations.' },
          { icon: Clock, text: 'Chaque plainte affiche son statut : Soumise → En cours → Traitée → Validée.' },
          { icon: Brain, text: "Cliquez sur une plainte pour voir l'analyse IA et les détails complets." },
          { icon: MessageSquare, text: "Quand l'agent répond et que le SG valide, vous verrez la réponse officielle." },
          { icon: ThumbsUp, text: 'Donnez votre avis : cliquez "Problème résolu" ou "Problème persiste".' },
          { icon: CheckCircle, text: 'Votre retour aide la commune à améliorer ses services !' },
        ],
      },
      {
        id: 'statuts',
        icon: BarChart3,
        title: 'Comprendre les statuts',
        color: 'purple',
        steps: [
          { icon: Clock, text: 'Soumise : Votre plainte vient d\'être enregistrée, en attente de prise en charge.' },
          { icon: Play, text: 'En cours : Un agent municipal travaille sur votre problème.' },
          { icon: Wrench, text: 'Traitée : L\'agent a proposé une solution, en attente de validation du SG.' },
          { icon: CheckCircle, text: 'Validée : La réponse est approuvée, vous pouvez donner votre avis.' },
          { icon: RotateCcw, text: 'Retour agent : Le SG a demandé des corrections (vous serez informé).' },
        ],
      },
    ],
  },
  agent: {
    title: "Guide de l'Agent Municipal",
    subtitle: 'Comment traiter les plaintes des citoyens efficacement',
    sections: [
      {
        id: 'traiter',
        icon: Wrench,
        title: 'Traiter une plainte',
        color: 'blue',
        steps: [
          { icon: FileText, text: 'Allez dans "Plaintes" pour voir toutes les plaintes à traiter.' },
          { icon: Play, text: 'Cliquez sur une plainte "Soumise" puis "Prendre en charge" pour commencer.' },
          { icon: Brain, text: "Consultez l'onglet \"Analyse IA\" pour voir le résumé intelligent du problème." },
          { icon: Wrench, text: 'Dans l\'onglet "Traitement", remplissez : Diagnostic, Actions menées, Réponse au citoyen.' },
          { icon: Send, text: 'Cliquez "Soumettre pour validation" — la réponse sera envoyée au Secrétaire Général.' },
          { icon: CheckCircle, text: 'Utilisez les modèles de réponse rapide pour gagner du temps.' },
        ],
      },
      {
        id: 'retour',
        icon: RotateCcw,
        title: 'Gérer les retours du SG',
        color: 'orange',
        steps: [
          { icon: AlertTriangle, text: 'Les plaintes avec "Retour SG" sont signalées en orange dans la liste.' },
          { icon: RotateCcw, text: 'Le commentaire du SG s\'affiche en haut — lisez bien les corrections demandées.' },
          { icon: Wrench, text: 'Votre réponse précédente est pré-remplie dans le formulaire de correction.' },
          { icon: Send, text: 'Corrigez les points mentionnés puis cliquez "Renvoyer pour validation".' },
        ],
      },
      {
        id: 'suivi',
        icon: ThumbsUp,
        title: 'Suivre le retour des citoyens',
        color: 'green',
        steps: [
          { icon: CheckCircle, text: 'Quand le SG valide, une notification verte apparaît sur la plainte.' },
          { icon: ThumbsUp, text: "L'onglet \"Suivi citoyen\" montre si le citoyen est satisfait ou non." },
          { icon: Users, text: 'Si le citoyen est insatisfait, contactez-le pour un suivi complémentaire.' },
          { icon: BarChart3, text: 'Le tableau de bord affiche vos statistiques : plaintes traitées, en cours, etc.' },
        ],
      },
    ],
  },
  secretaire_general: {
    title: 'Guide du Secrétaire Général',
    subtitle: 'Comment valider et superviser les réponses des agents',
    sections: [
      {
        id: 'valider',
        icon: CheckCircle,
        title: 'Valider une réponse',
        color: 'green',
        steps: [
          { icon: FileText, text: 'Allez dans "Validation" pour voir les réponses en attente.' },
          { icon: FileText, text: 'Cliquez sur une plainte "À valider" pour voir les détails complets.' },
          { icon: Brain, text: "Consultez l'analyse IA et la réponse complète de l'agent (diagnostic + actions + réponse)." },
          { icon: CheckCircle, text: 'Cliquez "Valider et envoyer au citoyen" pour approuver la réponse.' },
          { icon: Send, text: 'Le citoyen recevra la réponse et pourra donner son avis.' },
        ],
      },
      {
        id: 'retourner',
        icon: RotateCcw,
        title: "Retourner à l'agent",
        color: 'orange',
        steps: [
          { icon: AlertTriangle, text: "Si la réponse de l'agent est insuffisante, rédigez un commentaire explicatif." },
          { icon: RotateCcw, text: 'Cliquez "Retour à l\'agent" — le commentaire est obligatoire.' },
          { icon: Wrench, text: "L'agent verra votre commentaire et corrigera sa réponse." },
          { icon: Send, text: "Une fois corrigée, la réponse reviendra dans vos \"À valider\"." },
        ],
      },
      {
        id: 'filtres',
        icon: BarChart3,
        title: 'Utiliser les filtres',
        color: 'purple',
        steps: [
          { icon: Clock, text: '"À valider" : réponses d\'agents en attente de votre décision.' },
          { icon: CheckCircle, text: '"Validées" : réponses que vous avez approuvées (avec retour citoyen).' },
          { icon: RotateCcw, text: '"Retournées" : réponses renvoyées à l\'agent pour correction.' },
          { icon: FileText, text: '"Toutes" : vue complète de toutes les plaintes.' },
          { icon: ThumbsUp, text: 'Les badges colorés indiquent la satisfaction du citoyen sur chaque plainte.' },
        ],
      },
    ],
  },
  administrateur: {
    title: "Guide de l'Administrateur",
    subtitle: 'Comment gérer les utilisateurs et superviser la plateforme',
    sections: [
      {
        id: 'users',
        icon: Users,
        title: 'Gérer les utilisateurs',
        color: 'blue',
        steps: [
          { icon: Users, text: 'Allez dans "Utilisateurs" pour voir tous les comptes de la plateforme.' },
          { icon: Send, text: 'Créez de nouveaux comptes (citoyen, agent, SG) avec le bouton "Ajouter".' },
          { icon: Shield, text: 'Modifiez les rôles, désactivez ou réactivez les comptes si nécessaire.' },
          { icon: AlertTriangle, text: 'Les agents désactivés ne pourront plus traiter les plaintes.' },
        ],
      },
      {
        id: 'plaintes',
        icon: FileText,
        title: 'Superviser les plaintes',
        color: 'green',
        steps: [
          { icon: FileText, text: 'Allez dans "Plaintes" pour voir toutes les réclamations de la plateforme.' },
          { icon: Wrench, text: 'Réassignez une plainte à un autre agent si nécessaire.' },
          { icon: BarChart3, text: 'Changez la catégorie ou l\'urgence d\'une plainte pour corriger la classification.' },
          { icon: CheckCircle, text: 'Modifiez le statut directement en cas de besoin exceptionnel.' },
        ],
      },
      {
        id: 'stats',
        icon: BarChart3,
        title: 'Consulter les statistiques',
        color: 'purple',
        steps: [
          { icon: BarChart3, text: 'Le tableau de bord affiche les indicateurs clés de la plateforme.' },
          { icon: Clock, text: 'Total des plaintes, en attente, en cours, résolues et urgentes.' },
          { icon: FileText, text: 'Répartition par catégorie pour identifier les problèmes récurrents.' },
        ],
      },
    ],
  },
};

const colorClasses = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', title: 'text-blue-800', step: 'bg-blue-100', dot: 'bg-blue-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', title: 'text-green-800', step: 'bg-green-100', dot: 'bg-green-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', title: 'text-orange-800', step: 'bg-orange-100', dot: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', title: 'text-purple-800', step: 'bg-purple-100', dot: 'bg-purple-500' },
};

export default function Guide() {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState(null);
  const guide = GUIDES[user?.role] || GUIDES.citoyen;

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1e3a5f] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{guide.title}</h1>
            <p className="text-slate-500 mt-2">{guide.subtitle}</p>
          </div>

          {/* Workflow overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Flux de traitement d'une plainte</h3>
            <div className="flex items-center justify-between text-xs">
              {[
                { label: 'Citoyen\ndépose', icon: MessageSquare, color: 'text-blue-600' },
                { label: 'Agent\ntraite', icon: Wrench, color: 'text-orange-600' },
                { label: 'SG\nvalide', icon: CheckCircle, color: 'text-purple-600' },
                { label: 'Citoyen\nconfirme', icon: ThumbsUp, color: 'text-green-600' },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center mb-1.5 ${step.color}`}>
                      <step.icon size={20} />
                    </div>
                    <span className="text-slate-600 whitespace-pre-line font-medium leading-tight">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ChevronRight size={16} className="text-slate-300 mx-3 -mt-5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {guide.sections.map((section) => {
              const colors = colorClasses[section.color];
              const isOpen = openSection === section.id;

              return (
                <div key={section.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenSection(isOpen ? null : section.id)}
                    className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${
                      isOpen ? colors.bg : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                      <section.icon size={20} className={colors.icon} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isOpen ? colors.title : 'text-slate-800'}`}>{section.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{section.steps.length} étapes</p>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="space-y-3 ml-2">
                        {section.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full ${colors.step} flex items-center justify-center flex-shrink-0`}>
                                <step.icon size={14} className={colors.icon} />
                              </div>
                              {i < section.steps.length - 1 && (
                                <div className={`w-0.5 h-6 ${colors.step} mt-1`}></div>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 pt-1 leading-relaxed">{step.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-6 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f] rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Brain size={18} />
              Conseils utiles
            </h3>
            <ul className="space-y-2 text-sm text-blue-100">
              {user?.role === 'citoyen' && (
                <>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Soyez le plus précis possible dans votre description pour un traitement rapide.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Indiquez toujours la localisation exacte (rue, numéro, quartier).</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Donnez votre avis après résolution — cela aide à améliorer le service.</li>
                </>
              )}
              {user?.role === 'agent' && (
                <>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Consultez l'analyse IA avant de rédiger — elle identifie les points clés.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Utilisez les modèles de réponse rapide pour les cas courants.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> En cas de retour SG, lisez bien le commentaire avant de corriger.</li>
                </>
              )}
              {user?.role === 'secretaire_general' && (
                <>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Vérifiez que la réponse de l'agent est complète (diagnostic + actions + réponse).</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Soyez précis dans vos commentaires de retour pour faciliter la correction.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Suivez les retours citoyens pour évaluer la qualité du service.</li>
                </>
              )}
              {user?.role === 'administrateur' && (
                <>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Vérifiez régulièrement les plaintes non assignées ou bloquées.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Créez des comptes agent pour chaque service municipal.</li>
                  <li className="flex items-start gap-2"><span className="text-orange-300">•</span> Consultez les statistiques pour identifier les tendances.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
