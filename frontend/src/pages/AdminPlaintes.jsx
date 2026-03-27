import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import { FileText, Search, MapPin, Clock, User } from 'lucide-react';
import { ExportToolbar } from '../components/ExportButtons';
import toast from 'react-hot-toast';

export default function AdminPlaintes() {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [selectedPlainte, setSelectedPlainte] = useState(null);

  useEffect(() => {
    loadPlaintes();
  }, [filterStatut, filterCategorie]);

  const loadPlaintes = async () => {
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;
      if (filterCategorie) params.categorie = filterCategorie;
      const res = await api.get('/plaintes', { params });
      setPlaintes(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaintes = plaintes.filter(p =>
    `${p.titre} ${p.description} ${p.citoyen?.nom || ''} ${p.citoyen?.prenom || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Toutes les plaintes</h1>
            <p className="text-slate-500 text-sm mt-1">Vue administrative de toutes les plaintes</p>
          </div>
          <ExportToolbar plaintes={filteredPlaintes} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Tous statuts</option>
            <option value="soumise">Soumise</option>
            <option value="en_cours">En cours</option>
            <option value="traitee">Traitée</option>
            <option value="validee">Validée</option>
            <option value="rejetee">Rejetée</option>
            <option value="retour_agent">Retour agent</option>
          </select>
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Toutes catégories</option>
            <option value="voirie">Voirie</option>
            <option value="eclairage_public">Éclairage public</option>
            <option value="assainissement">Assainissement</option>
            <option value="nuisance_sonore">Nuisance sonore</option>
            <option value="urbanisme">Urbanisme</option>
            <option value="administratif">Administratif</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Titre</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Citoyen</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Urgence</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Agent</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlaintes.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedPlainte(selectedPlainte?.id === p.id ? null : p)}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">#{p.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 max-w-[200px] truncate">{p.titre}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {p.citoyen ? `${p.citoyen.prenom} ${p.citoyen.nom}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm"><CategorieLabel categorie={p.categorie} /></td>
                      <td className="px-6 py-4"><UrgenceBadge urgence={p.urgence} /></td>
                      <td className="px-6 py-4"><StatusBadge statut={p.statut} /></td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {p.agent ? `${p.agent.prenom} ${p.agent.nom}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPlaintes.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <FileText size={40} className="mx-auto mb-2 opacity-50" />
                <p>Aucune plainte trouvée</p>
              </div>
            )}
          </div>
        )}

        {/* Detail panel */}
        {selectedPlainte && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Détails — #{selectedPlainte.id} {selectedPlainte.titre}</h3>
            <p className="text-sm text-slate-600 mb-4">{selectedPlainte.description}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {selectedPlainte.localisation && (
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={14} /> {selectedPlainte.localisation}
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-500">
                <Clock size={14} /> {new Date(selectedPlainte.created_at).toLocaleString('fr-FR')}
              </div>
            </div>
            {selectedPlainte.resume_ia && (
              <div className="mt-3 bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Résumé IA</p>
                <p className="text-sm text-blue-600">{selectedPlainte.resume_ia}</p>
              </div>
            )}
            {selectedPlainte.reponse_agent && (
              <div className="mt-3 bg-green-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-700 mb-1">Réponse agent</p>
                <p className="text-sm text-green-600">{selectedPlainte.reponse_agent}</p>
              </div>
            )}
            {selectedPlainte.commentaire_sg && (
              <div className="mt-3 bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-1">Commentaire SG</p>
                <p className="text-sm text-purple-600">{selectedPlainte.commentaire_sg}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
