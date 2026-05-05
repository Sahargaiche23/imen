import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import Layout from '../components/Layout';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
import {
  FileText, MapPin, Clock, Send, ArrowLeft, AlertTriangle, User,
  Play, CheckCircle, ClipboardList, Wrench, MessageSquare, Brain,
  ThumbsUp, ThumbsDown, Bell, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const RESPONSE_TEMPLATES = [
  { label: "Intervention planifiée", text: "Suite à l'examen de votre signalement, une intervention a été planifiée. Notre équipe technique se rendra sur place dans les meilleurs délais pour effectuer les travaux nécessaires. Vous serez informé(e) de l'avancement." },
  { label: "Problème résolu", text: "Nous avons le plaisir de vous informer que le problème signalé a été résolu. Notre équipe est intervenue sur site et a effectué les réparations/corrections nécessaires. N'hésitez pas à nous recontacter si le problème persiste." },
  { label: "Transfert de service", text: "Votre signalement a été analysé et transmis au service compétent pour un traitement spécialisé. Le service concerné prendra contact avec vous si des informations complémentaires sont nécessaires." },
  { label: "Demande d'information", text: "Nous avons bien pris en compte votre signalement. Afin de traiter votre demande de manière efficace, nous aurions besoin d'informations complémentaires. Un agent vous contactera prochainement." },
];

function parsePreviousResponse(reponse) {
  if (!reponse) return { diagnostic: '', actions: '', response: '' };
  const result = { diagnostic: '', actions: '', response: '' };
  const diagMatch = reponse.match(/DIAGNOSTIC :\n([\s\S]*?)(?=\n\nACTIONS MENÉES :|$|\n\nRÉPONSE AU CITOYEN :)/);
  const actionsMatch = reponse.match(/ACTIONS MENÉES :\n([\s\S]*?)(?=\n\nRÉPONSE AU CITOYEN :|$)/);
  const responseMatch = reponse.match(/RÉPONSE AU CITOYEN :\n([\s\S]*?)$/);
  if (diagMatch) result.diagnostic = diagMatch[1].trim();
  if (actionsMatch) result.actions = actionsMatch[1].trim();
  if (responseMatch) result.response = responseMatch[1].trim();
  if (!diagMatch && !actionsMatch && !responseMatch) {
    result.response = reponse;
  }
  return result;
}

export default function AgentPlaintes() {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [reponse, setReponse] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [actionsMenees, setActionsMenees] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatut, setFilterStatut] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadPlaintes();
  }, [filterStatut]);

  const loadPlaintes = async () => {
    try {
      const params = filterStatut ? { statut: filterStatut } : {};
      const res = await api.get('/plaintes', { params });
      setPlaintes(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const selectPlainte = (p) => {
    setSelectedPlainte(p);
    setActiveTab('details');
    // Pre-fill form fields for retour_agent
    if (p.statut === 'retour_agent' && p.reponse_agent) {
      const parsed = parsePreviousResponse(p.reponse_agent);
      setDiagnostic(parsed.diagnostic);
      setActionsMenees(parsed.actions);
      setReponse(parsed.response);
    } else {
      setDiagnostic('');
      setActionsMenees('');
      setReponse('');
    }
  };

  const prendreEnCharge = async (plainte) => {
    try {
      await api.put(`/plaintes/${plainte.id}`, { statut: 'en_cours' });
      toast.success('Plainte prise en charge — vous pouvez maintenant la traiter');
      const res = await api.get('/plaintes', { params: filterStatut ? { statut: filterStatut } : {} });
      setPlaintes(res.data);
      const updated = res.data.find(p => p.id === plainte.id);
      if (updated) {
        setSelectedPlainte(updated);
        setActiveTab('traitement');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const buildFullResponse = () => {
    const parts = [];
    if (diagnostic.trim()) parts.push(`DIAGNOSTIC :\n${diagnostic.trim()}`);
    if (actionsMenees.trim()) parts.push(`ACTIONS MENÉES :\n${actionsMenees.trim()}`);
    if (reponse.trim()) parts.push(`RÉPONSE AU CITOYEN :\n${reponse.trim()}`);
    return parts.join('\n\n');
  };

  const envoyerReponse = async () => {
    const fullReponse = buildFullResponse();
    if (!reponse.trim()) {
      toast.error('Veuillez remplir au moins la réponse au citoyen');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/plaintes/${selectedPlainte.id}`, {
        reponse_agent: fullReponse,
        statut: 'traitee',
      });
      toast.success('Réponse envoyée au Secrétaire Général pour validation');
      resetForm();
      loadPlaintes();
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReponse('');
    setDiagnostic('');
    setActionsMenees('');
    setSelectedPlainte(null);
    setActiveTab('details');
  };

  if (selectedPlainte) {
    const canTreat = selectedPlainte.statut === 'en_cours' || selectedPlainte.statut === 'retour_agent';
    const isNew = selectedPlainte.statut === 'soumise';
    const isValidated = selectedPlainte.statut === 'validee';
    const isRetour = selectedPlainte.statut === 'retour_agent';

    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <button
            onClick={resetForm}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          {/* Notification: SG returned for revision */}
          {isRetour && selectedPlainte.commentaire_sg && (
            <div className="bg-orange-50 border-l-4 border-orange-500 rounded-r-xl p-4 mb-4 flex items-start gap-3">
              <RotateCcw size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-800 text-sm">Retour du Secrétaire Général — Révision requise</p>
                <p className="text-sm text-orange-700 mt-1">« {selectedPlainte.commentaire_sg} »</p>
                <p className="text-xs text-orange-500 mt-2">Veuillez corriger votre réponse et la renvoyer pour validation.</p>
              </div>
            </div>
          )}

          {/* Notification: SG validated */}
          {isValidated && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 mb-4 flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Plainte validée par le Secrétaire Général</p>
                {selectedPlainte.commentaire_sg && (
                  <p className="text-sm text-green-700 mt-1">« {selectedPlainte.commentaire_sg} »</p>
                )}
                <p className="text-xs text-green-500 mt-2">Votre réponse a été transmise au citoyen. {!selectedPlainte.satisfaction && 'En attente du retour citoyen.'}</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-slate-400">#{selectedPlainte.id}</span>
                  <StatusBadge statut={selectedPlainte.statut} />
                  <UrgenceBadge urgence={selectedPlainte.urgence} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{selectedPlainte.titre}</h2>
              </div>
              {isNew && (
                <button
                  onClick={() => prendreEnCharge(selectedPlainte)}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all text-sm"
                >
                  <Play size={16} />
                  Prendre en charge
                </button>
              )}
              {isRetour && (
                <button
                  onClick={() => setActiveTab('traitement')}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all text-sm animate-pulse"
                >
                  <Wrench size={16} />
                  Corriger la réponse
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            {[
              { id: 'details', label: 'Détails', icon: ClipboardList },
              { id: 'analyse', label: 'Analyse IA', icon: Brain },
              ...(canTreat ? [{ id: 'traitement', label: isRetour ? 'Correction' : 'Traitement', icon: Wrench }] : []),
              ...(isValidated ? [{ id: 'suivi', label: 'Suivi citoyen', icon: Bell }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1e3a5f] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content: Details */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#1e3a5f]" />
                  Description du problème
                </h3>
                <p className="text-slate-600 leading-relaxed">{selectedPlainte.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Informations citoyen</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User size={15} className="text-slate-400" />
                      <span className="font-medium">{selectedPlainte.citoyen?.prenom} {selectedPlainte.citoyen?.nom}</span>
                    </div>
                    {selectedPlainte.citoyen?.telephone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-slate-400">📞</span>
                        <span>{selectedPlainte.citoyen.telephone}</span>
                      </div>
                    )}
                    {selectedPlainte.citoyen?.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-slate-400">✉️</span>
                        <span>{selectedPlainte.citoyen.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Détails de la plainte</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText size={15} className="text-slate-400" />
                      <CategorieLabel categorie={selectedPlainte.categorie} />
                    </div>
                    {selectedPlainte.localisation && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={15} className="text-slate-400" />
                        <span>{selectedPlainte.localisation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={15} className="text-slate-400" />
                      <span>{new Date(selectedPlainte.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GPS Map */}
              {selectedPlainte.latitude && selectedPlainte.longitude && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Localisation GPS
                  </h4>
                  <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: 250 }}>
                    <MapContainer
                      center={[selectedPlainte.latitude, selectedPlainte.longitude]}
                      zoom={16}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[selectedPlainte.latitude, selectedPlainte.longitude]} />
                    </MapContainer>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    📍 {selectedPlainte.latitude.toFixed(5)}, {selectedPlainte.longitude.toFixed(5)}
                    {selectedPlainte.localisation && ` — ${selectedPlainte.localisation}`}
                  </p>
                </div>
              )}

              {/* Photo */}
              {selectedPlainte.photo_url && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">📷 Photo jointe</h4>
                  <img
                    src={selectedPlainte.photo_url.startsWith('http') ? selectedPlainte.photo_url : `${import.meta.env.VITE_API_URL || ''}${selectedPlainte.photo_url}`}
                    alt="Photo plainte"
                    className="rounded-lg max-h-64 w-auto"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {selectedPlainte.commentaire_sg && (
                <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Retour du Secrétaire Général
                  </h4>
                  <p className="text-sm text-orange-700">{selectedPlainte.commentaire_sg}</p>
                </div>
              )}

              {selectedPlainte.reponse_agent && (
                <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                  <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Votre réponse précédente
                  </h4>
                  <p className="text-sm text-green-700 whitespace-pre-line">{selectedPlainte.reponse_agent}</p>
                </div>
              )}

              {selectedPlainte.satisfaction && (
                <div className={`rounded-xl border p-5 ${
                  selectedPlainte.satisfaction === 'satisfait'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                    selectedPlainte.satisfaction === 'satisfait' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {selectedPlainte.satisfaction === 'satisfait' ? '👍' : '👎'}
                    Retour du citoyen : {selectedPlainte.satisfaction === 'satisfait' ? 'Satisfait' : 'Non satisfait'}
                  </h4>
                  {selectedPlainte.feedback_citoyen && (
                    <p className={`text-sm ${
                      selectedPlainte.satisfaction === 'satisfait' ? 'text-green-700' : 'text-red-700'
                    }`}>{selectedPlainte.feedback_citoyen}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab content: AI Analysis */}
          {activeTab === 'analyse' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Brain size={18} className="text-blue-600" />
                Analyse intelligente
              </h3>
              {selectedPlainte.resume_ia ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selectedPlainte.resume_ia}</pre>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Aucune analyse disponible pour cette plainte</p>
              )}
            </div>
          )}

          {/* Tab content: Treatment */}
          {activeTab === 'traitement' && canTreat && (
            <div className="space-y-4">
              {/* SG comment in treatment tab for retour_agent */}
              {isRetour && selectedPlainte.commentaire_sg && (
                <div className="bg-orange-50 rounded-xl border border-orange-300 p-5">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <RotateCcw size={16} />
                    Motif du retour — Secrétaire Général
                  </h4>
                  <p className="text-sm text-orange-700 bg-white/60 rounded-lg p-3 italic">« {selectedPlainte.commentaire_sg} »</p>
                  <p className="text-xs text-orange-500 mt-2">Corrigez les points mentionnés ci-dessus avant de renvoyer.</p>
                </div>
              )}

              {/* Diagnostic */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <ClipboardList size={18} className="text-blue-600" />
                  Diagnostic
                </h3>
                <p className="text-xs text-slate-400 mb-3">Décrivez votre analyse du problème signalé</p>
                <textarea
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  placeholder="Ex: Après vérification sur site, il s'agit d'une fuite au niveau du raccordement principal..."
                  className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Wrench size={18} className="text-orange-600" />
                  Actions menées
                </h3>
                <p className="text-xs text-slate-400 mb-3">Détaillez les actions entreprises ou planifiées</p>
                <textarea
                  value={actionsMenees}
                  onChange={(e) => setActionsMenees(e.target.value)}
                  placeholder="Ex: 1. Visite sur site effectuée le 15/03&#10;2. Équipe de réparation envoyée&#10;3. Travaux terminés le 17/03"
                  className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* Response to citizen */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Send size={18} className="text-green-600" />
                    Réponse au citoyen
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">Cette réponse sera visible par le citoyen après validation du SG</p>

                {/* Quick templates */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {RESPONSE_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => setReponse(tpl.text)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder="Rédigez la réponse qui sera envoyée au citoyen..."
                  className="w-full h-32 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    La réponse sera soumise au Secrétaire Général pour validation
                  </p>
                  <button
                    onClick={envoyerReponse}
                    disabled={submitting || !reponse.trim()}
                    className="flex items-center gap-2 bg-[#1e3a5f] text-white px-6 py-2.5 rounded-lg hover:bg-[#152a45] transition-colors disabled:opacity-50 text-sm font-semibold"
                  >
                    <Send size={16} />
                    {submitting ? 'Envoi en cours...' : isRetour ? 'Renvoyer pour validation' : 'Soumettre pour validation'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab content: Suivi citoyen (after SG validation) */}
          {activeTab === 'suivi' && isValidated && (
            <div className="space-y-4">
              {/* Validation summary */}
              <div className="bg-white rounded-xl border border-green-200 p-6">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} />
                  Réponse validée et transmise au citoyen
                </h3>
                {selectedPlainte.reponse_agent && (
                  <div className="bg-green-50 rounded-lg p-4 mb-3">
                    <p className="text-xs font-semibold text-green-600 mb-1">Votre réponse envoyée :</p>
                    <p className="text-sm text-green-800 whitespace-pre-line">{selectedPlainte.reponse_agent}</p>
                  </div>
                )}
                {selectedPlainte.commentaire_sg && (
                  <div className="bg-purple-50 rounded-lg p-3 text-sm">
                    <span className="font-semibold text-purple-700">Commentaire SG : </span>
                    <span className="text-purple-600">{selectedPlainte.commentaire_sg}</span>
                  </div>
                )}
              </div>

              {/* Citizen feedback status */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-blue-600" />
                  Retour du citoyen
                </h3>

                {selectedPlainte.satisfaction ? (
                  <div className={`rounded-lg p-5 ${
                    selectedPlainte.satisfaction === 'satisfait'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      {selectedPlainte.satisfaction === 'satisfait' ? (
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <ThumbsUp size={24} className="text-green-600" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <ThumbsDown size={24} className="text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className={`font-semibold ${
                          selectedPlainte.satisfaction === 'satisfait' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {selectedPlainte.satisfaction === 'satisfait' ? 'Citoyen satisfait' : 'Citoyen non satisfait'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedPlainte.citoyen?.prenom} {selectedPlainte.citoyen?.nom}
                        </p>
                      </div>
                    </div>
                    {selectedPlainte.feedback_citoyen && (
                      <div className="mt-2 bg-white/70 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Commentaire du citoyen :</p>
                        <p className={`text-sm ${
                          selectedPlainte.satisfaction === 'satisfait' ? 'text-green-700' : 'text-red-700'
                        }`}>« {selectedPlainte.feedback_citoyen} »</p>
                      </div>
                    )}
                    {selectedPlainte.satisfaction === 'non_satisfait' && (
                      <div className="mt-3 bg-red-100/50 rounded-lg p-3 text-xs text-red-700">
                        <AlertTriangle size={14} className="inline mr-1" />
                        Le citoyen n'est pas satisfait. Vous pouvez contacter le citoyen pour un suivi complémentaire.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock size={28} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">En attente du retour citoyen</p>
                    <p className="text-xs text-slate-400 mt-1">Le citoyen n'a pas encore donné son avis sur la résolution</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestion des plaintes</h1>
            <p className="text-slate-500 text-sm mt-1">Traitez les plaintes des citoyens</p>
          </div>
          <div className="flex gap-2">
            {[
              { value: '', label: 'Toutes' },
              { value: 'soumise', label: 'Nouvelles' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'retour_agent', label: 'Retour SG' },
              { value: 'traitee', label: 'Traitées' },
              { value: 'validee', label: 'Validées' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterStatut(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatut === f.value
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
          </div>
        ) : plaintes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <FileText size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Aucune plainte trouvée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plaintes.map((p) => (
              <div
                key={p.id}
                onClick={() => selectPlainte(p)}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer ${
                  p.statut === 'retour_agent'
                    ? 'border-orange-300 bg-orange-50/50'
                    : p.statut === 'validee' && p.satisfaction === 'non_satisfait'
                    ? 'border-red-200 bg-red-50/30'
                    : p.statut === 'validee'
                    ? 'border-green-200 bg-green-50/30'
                    : p.urgence === 'haute' && p.statut === 'soumise'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-slate-400">#{p.id}</span>
                      <StatusBadge statut={p.statut} />
                      <UrgenceBadge urgence={p.urgence} />
                      {p.urgence === 'haute' && (
                        <AlertTriangle size={14} className="text-red-500" />
                      )}
                      {p.statut === 'retour_agent' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          Action requise
                        </span>
                      )}
                      {p.statut === 'validee' && !p.satisfaction && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Attente retour citoyen
                        </span>
                      )}
                      {p.satisfaction === 'satisfait' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <ThumbsUp size={10} /> Satisfait
                        </span>
                      )}
                      {p.satisfaction === 'non_satisfait' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <ThumbsDown size={10} /> Non satisfait
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800">{p.titre}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span><CategorieLabel categorie={p.categorie} /></span>
                      {p.citoyen && <span className="flex items-center gap-1"><User size={12} />{p.citoyen.prenom} {p.citoyen.nom}</span>}
                      {p.localisation && <span className="flex items-center gap-1"><MapPin size={12} />{p.localisation}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <ArrowLeft size={16} className="rotate-180 text-slate-300 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
