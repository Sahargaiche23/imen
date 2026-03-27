import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import {
  FileText, MapPin, Clock, ArrowLeft, ThumbsUp, ThumbsDown,
  Send, CheckCircle, AlertTriangle, MessageSquare, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

function extractCitizenResponse(reponse) {
  if (!reponse) return null;
  const marker = 'RÉPONSE AU CITOYEN :';
  const idx = reponse.indexOf(marker);
  if (idx !== -1) {
    return reponse.substring(idx + marker.length).trim();
  }
  return reponse;
}

export default function CitizenPlaintes() {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [filterStatut, setFilterStatut] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const envoyerFeedback = async (satisfaction) => {
    setSubmitting(true);
    try {
      await api.put(`/plaintes/${selectedPlainte.id}`, {
        feedback_citoyen: feedback || (satisfaction === 'satisfait' ? 'Problème résolu, merci.' : 'Le problème persiste.'),
        satisfaction,
      });
      toast.success(satisfaction === 'satisfait' ? 'Merci pour votre retour !' : 'Votre retour a été transmis à l\'agent');
      setFeedback('');
      const res = await api.get('/plaintes', { params: filterStatut ? { statut: filterStatut } : {} });
      setPlaintes(res.data);
      const updated = res.data.find(p => p.id === selectedPlainte.id);
      setSelectedPlainte(updated || null);
    } catch {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  // Detail view
  if (selectedPlainte) {
    const citizenResponse = extractCitizenResponse(selectedPlainte.reponse_agent);
    const hasResponse = selectedPlainte.reponse_agent && (selectedPlainte.statut === 'validee' || selectedPlainte.statut === 'traitee');
    const canGiveFeedback = selectedPlainte.statut === 'validee' && !selectedPlainte.satisfaction;

    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <button
            onClick={() => { setSelectedPlainte(null); setFeedback(''); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft size={16} /> Retour à mes plaintes
          </button>

          <div className="max-w-3xl">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-slate-400">#{selectedPlainte.id}</span>
                <StatusBadge statut={selectedPlainte.statut} />
                <UrgenceBadge urgence={selectedPlainte.urgence} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedPlainte.titre}</h2>
              <p className="text-slate-600 leading-relaxed">{selectedPlainte.description}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><FileText size={12} /><CategorieLabel categorie={selectedPlainte.categorie} /></span>
                {selectedPlainte.localisation && <span className="flex items-center gap-1"><MapPin size={12} />{selectedPlainte.localisation}</span>}
                <span className="flex items-center gap-1"><Clock size={12} />{new Date(selectedPlainte.created_at).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            {/* Progress timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">Suivi de votre plainte</h3>
              <div className="flex items-center gap-0">
                {[
                  { key: 'soumise', label: 'Soumise' },
                  { key: 'en_cours', label: 'En cours' },
                  { key: 'traitee', label: 'Traitée' },
                  { key: 'validee', label: 'Résolue' },
                ].map((step, i, arr) => {
                  const statusOrder = ['soumise', 'en_cours', 'traitee', 'validee'];
                  const currentIdx = statusOrder.indexOf(selectedPlainte.statut);
                  const stepIdx = statusOrder.indexOf(step.key);
                  const isActive = stepIdx <= currentIdx && currentIdx >= 0;
                  const isCurrent = step.key === selectedPlainte.statut;

                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? isCurrent ? 'bg-[#1e3a5f] text-white ring-4 ring-blue-100' : 'bg-green-500 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {isActive && !isCurrent ? <CheckCircle size={16} /> : i + 1}
                        </div>
                        <span className={`text-xs mt-1.5 ${isActive ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{step.label}</span>
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`h-0.5 w-full -mt-5 ${stepIdx < currentIdx ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedPlainte.statut === 'retour_agent' && (
                <div className="mt-3 bg-orange-50 rounded-lg p-3 text-sm text-orange-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  La réponse est en cours de révision par l'agent
                </div>
              )}
            </div>

            {/* AI Analysis (collapsible) */}
            {selectedPlainte.resume_ia && (
              <details className="bg-white rounded-xl border border-slate-200 mb-4 group">
                <summary className="px-6 py-4 cursor-pointer flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                  <Brain size={16} className="text-blue-600" />
                  Analyse automatique
                  <span className="ml-auto text-xs text-slate-400 group-open:hidden">Cliquez pour voir</span>
                </summary>
                <div className="px-6 pb-5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selectedPlainte.resume_ia}</pre>
                  </div>
                </div>
              </details>
            )}

            {/* Agent response - clean view for citizen */}
            {hasResponse && citizenResponse && (
              <div className="bg-white rounded-xl border border-green-200 p-6 mb-4">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Réponse de la commune
                </h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800 leading-relaxed">{citizenResponse}</p>
                </div>
                {selectedPlainte.agent && (
                  <p className="text-xs text-slate-400 mt-3">
                    Agent : {selectedPlainte.agent.prenom} {selectedPlainte.agent.nom}
                  </p>
                )}
              </div>
            )}

            {/* SG comment */}
            {selectedPlainte.commentaire_sg && selectedPlainte.statut === 'validee' && (
              <div className="bg-white rounded-xl border border-purple-200 p-6 mb-4">
                <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Décision officielle
                </h3>
                <p className="text-sm text-purple-700">{selectedPlainte.commentaire_sg}</p>
              </div>
            )}

            {/* Existing feedback display */}
            {selectedPlainte.satisfaction && (
              <div className={`rounded-xl border p-6 mb-4 ${
                selectedPlainte.satisfaction === 'satisfait'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  selectedPlainte.satisfaction === 'satisfait' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {selectedPlainte.satisfaction === 'satisfait' ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                  Votre retour : {selectedPlainte.satisfaction === 'satisfait' ? 'Satisfait' : 'Non satisfait'}
                </h3>
                {selectedPlainte.feedback_citoyen && (
                  <p className={`text-sm ${
                    selectedPlainte.satisfaction === 'satisfait' ? 'text-green-700' : 'text-red-700'
                  }`}>{selectedPlainte.feedback_citoyen}</p>
                )}
              </div>
            )}

            {/* Feedback form */}
            {canGiveFeedback && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-1">Donnez votre avis</h3>
                <p className="text-xs text-slate-400 mb-4">Le problème a-t-il été résolu de manière satisfaisante ?</p>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ajoutez un commentaire (facultatif)..."
                  className="w-full h-20 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => envoyerFeedback('satisfait')}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp size={18} />
                    Oui, problème résolu
                  </button>
                  <button
                    onClick={() => envoyerFeedback('non_satisfait')}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <ThumbsDown size={18} />
                    Non, problème persiste
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // List view
  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mes plaintes</h1>
            <p className="text-slate-500 text-sm mt-1">Suivez l'état de vos réclamations</p>
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="soumise">Soumise</option>
            <option value="en_cours">En cours</option>
            <option value="traitee">Traitée</option>
            <option value="validee">Validée</option>
            <option value="rejetee">Rejetée</option>
          </select>
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
          <div className="space-y-4">
            {plaintes.map((p) => {
              const hasValidatedResponse = p.statut === 'validee' && p.reponse_agent;
              const needsFeedback = hasValidatedResponse && !p.satisfaction;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlainte(p)}
                  className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer ${
                    needsFeedback
                      ? 'border-blue-300 bg-blue-50/30'
                      : 'border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-slate-400">#{p.id}</span>
                        <StatusBadge statut={p.statut} />
                        <UrgenceBadge urgence={p.urgence} />
                        {needsFeedback && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Votre avis requis
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
                      <h3 className="font-semibold text-slate-800 mb-1">{p.titre}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><FileText size={12} /><CategorieLabel categorie={p.categorie} /></span>
                        {p.localisation && <span className="flex items-center gap-1"><MapPin size={12} />{p.localisation}</span>}
                        <span className="flex items-center gap-1"><Clock size={12} />{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    <ArrowLeft size={16} className="rotate-180 text-slate-300 mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
