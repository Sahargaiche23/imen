import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import {
  CheckCircle, XCircle, ArrowLeft, User, MapPin, Clock, FileText,
  AlertTriangle, ThumbsUp, ThumbsDown, RotateCcw, Brain, MessageSquare
} from 'lucide-react';
import { ExportToolbar } from '../components/ExportButtons';
import toast from 'react-hot-toast';

export default function SGValidation() {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlainte, setSelectedPlainte] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('traitee');

  useEffect(() => {
    loadPlaintes();
  }, [filter]);

  const loadPlaintes = async () => {
    setLoading(true);
    try {
      const params = filter ? { statut: filter } : {};
      const res = await api.get('/plaintes', { params });
      setPlaintes(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const valider = async () => {
    setSubmitting(true);
    try {
      await api.put(`/plaintes/${selectedPlainte.id}`, {
        statut: 'validee',
        commentaire_sg: commentaire || 'Validé par le Secrétaire Général',
      });
      toast.success('Réponse validée et envoyée au citoyen');
      setSelectedPlainte(null);
      setCommentaire('');
      loadPlaintes();
    } catch {
      toast.error('Erreur de validation');
    } finally {
      setSubmitting(false);
    }
  };

  const retourAgent = async () => {
    if (!commentaire.trim()) {
      toast.error('Veuillez ajouter un commentaire pour le retour');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/plaintes/${selectedPlainte.id}`, {
        statut: 'retour_agent',
        commentaire_sg: commentaire,
      });
      toast.success("Retourné à l'agent pour correction");
      setSelectedPlainte(null);
      setCommentaire('');
      loadPlaintes();
    } catch {
      toast.error('Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  // Detail view
  if (selectedPlainte) {
    const canDecide = selectedPlainte.statut === 'traitee';
    const isRetour = selectedPlainte.statut === 'retour_agent';
    const isValidee = selectedPlainte.statut === 'validee';

    return (
      <Layout>
        <div className="p-6 lg:p-8">
          <button
            onClick={() => { setSelectedPlainte(null); setCommentaire(''); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          <div className="max-w-3xl">
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-slate-400">#{selectedPlainte.id}</span>
                <StatusBadge statut={selectedPlainte.statut} />
                <UrgenceBadge urgence={selectedPlainte.urgence} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedPlainte.titre}</h2>
              <p className="text-slate-600 mb-4">{selectedPlainte.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <User size={14} />
                  <span>Citoyen : {selectedPlainte.citoyen?.prenom} {selectedPlainte.citoyen?.nom}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <FileText size={14} />
                  <CategorieLabel categorie={selectedPlainte.categorie} />
                </div>
                {selectedPlainte.localisation && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} />
                    <span>{selectedPlainte.localisation}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={14} />
                  <span>{new Date(selectedPlainte.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {selectedPlainte.resume_ia && (
              <details className="bg-white rounded-xl border border-slate-200 mb-4 group">
                <summary className="px-6 py-4 cursor-pointer flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
                  <Brain size={16} className="text-blue-600" />
                  Analyse IA
                  <span className="ml-auto text-xs text-slate-400 group-open:hidden">Cliquer pour voir</span>
                </summary>
                <div className="px-6 pb-5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selectedPlainte.resume_ia}</pre>
                  </div>
                </div>
              </details>
            )}

            {/* Agent response */}
            {selectedPlainte.reponse_agent && (
              <div className="bg-white rounded-xl border border-green-200 p-6 mb-4">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Réponse de l'agent {selectedPlainte.agent ? `(${selectedPlainte.agent.prenom} ${selectedPlainte.agent.nom})` : ''}
                </h3>
                <pre className="text-sm text-green-700 whitespace-pre-wrap font-sans leading-relaxed bg-green-50 rounded-lg p-4">{selectedPlainte.reponse_agent}</pre>
              </div>
            )}

            {/* SG previous comment (for retour_agent or validee) */}
            {selectedPlainte.commentaire_sg && (isRetour || isValidee) && (
              <div className={`rounded-xl border p-5 mb-4 ${
                isRetour ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  isRetour ? 'text-orange-800' : 'text-purple-800'
                }`}>
                  {isRetour ? <RotateCcw size={16} /> : <CheckCircle size={16} />}
                  {isRetour ? 'Votre commentaire de retour' : 'Votre commentaire de validation'}
                </h4>
                <p className={`text-sm ${isRetour ? 'text-orange-700' : 'text-purple-700'}`}>
                  « {selectedPlainte.commentaire_sg} »
                </p>
              </div>
            )}

            {/* Citizen feedback */}
            {selectedPlainte.satisfaction && (
              <div className={`rounded-xl border p-5 mb-4 ${
                selectedPlainte.satisfaction === 'satisfait'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  selectedPlainte.satisfaction === 'satisfait' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {selectedPlainte.satisfaction === 'satisfait' ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                  Retour du citoyen : {selectedPlainte.satisfaction === 'satisfait' ? 'Satisfait' : 'Non satisfait'}
                </h4>
                {selectedPlainte.feedback_citoyen && (
                  <p className={`text-sm ${
                    selectedPlainte.satisfaction === 'satisfait' ? 'text-green-700' : 'text-red-700'
                  }`}>« {selectedPlainte.feedback_citoyen} »</p>
                )}
              </div>
            )}

            {/* Decision form - only for traitee status */}
            {canDecide && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-3">Décision de validation</h3>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajoutez un commentaire (obligatoire pour un retour à l'agent)..."
                  className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={valider}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    Valider et envoyer au citoyen
                  </button>
                  <button
                    onClick={retourAgent}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={18} />
                    Retour à l'agent
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
  const filterCounts = {
    traitee: 'À valider',
    validee: 'Validées',
    retour_agent: 'Retournées',
    '': 'Toutes',
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Validation des réponses</h1>
            <p className="text-slate-500 text-sm mt-1">Validez ou refusez les réponses des agents</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportToolbar plaintes={plaintes} />
            <div className="flex gap-2">
            {Object.entries(filterCounts).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === value
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
          </div>
        ) : plaintes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Aucune plainte dans cette catégorie</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plaintes.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlainte(p)}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer ${
                  p.statut === 'retour_agent'
                    ? 'border-orange-300 bg-orange-50/50'
                    : p.statut === 'validee' && p.satisfaction === 'non_satisfait'
                    ? 'border-red-200 bg-red-50/30'
                    : p.statut === 'validee'
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-slate-400">#{p.id}</span>
                      <StatusBadge statut={p.statut} />
                      <UrgenceBadge urgence={p.urgence} />
                      {p.statut === 'retour_agent' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <RotateCcw size={10} /> En attente agent
                        </span>
                      )}
                      {p.satisfaction === 'satisfait' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <ThumbsUp size={10} /> Citoyen satisfait
                        </span>
                      )}
                      {p.satisfaction === 'non_satisfait' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <ThumbsDown size={10} /> Citoyen insatisfait
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800">{p.titre}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span><CategorieLabel categorie={p.categorie} /></span>
                      {p.agent && <span className="flex items-center gap-1"><User size={12} />{p.agent.prenom} {p.agent.nom}</span>}
                      {p.citoyen && <span className="flex items-center gap-1">Citoyen: {p.citoyen.prenom} {p.citoyen.nom}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {p.statut === 'retour_agent' && p.commentaire_sg && (
                      <p className="text-xs text-orange-600 mt-2 italic">Votre commentaire : « {p.commentaire_sg} »</p>
                    )}
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
