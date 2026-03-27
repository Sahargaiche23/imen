import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';
import Layout from '../components/Layout';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import { Filter, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const URGENCE_ICONS = {
  haute: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  }),
  moyenne: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  }),
  basse: new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  }),
};

// Simulated geocoding: distribute complaints across Algiers area
const LOCATION_COORDS = {
  default: [36.7538, 3.0588],
};

function getCoords(localisation, index) {
  // Distribute points around Algiers center with slight randomization
  const base = LOCATION_COORDS.default;
  const angle = (index * 137.5) * (Math.PI / 180); // golden angle
  const radius = 0.005 + (index * 0.003);
  return [
    base[0] + radius * Math.cos(angle),
    base[1] + radius * Math.sin(angle),
  ];
}

export default function CartePlaintes() {
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [filterUrg, setFilterUrg] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    loadPlaintes();
  }, []);

  const loadPlaintes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plaintes');
      setPlaintes(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = plaintes.filter(p => {
    if (filterCat && p.categorie !== filterCat) return false;
    if (filterUrg && p.urgence !== filterUrg) return false;
    if (filterStatut && p.statut !== filterStatut) return false;
    return true;
  });

  const categories = [...new Set(plaintes.map(p => p.categorie))];
  const statuts = [...new Set(plaintes.map(p => p.statut))];

  const CAT_LABELS = {
    voirie: 'Voirie', eclairage_public: 'Éclairage', assainissement: 'Assainissement',
    nuisance_sonore: 'Nuisance', urbanisme: 'Urbanisme', administratif: 'Administratif', autre: 'Autre',
  };
  const STATUT_LABELS = {
    soumise: 'Soumise', en_cours: 'En cours', traitee: 'Traitée',
    validee: 'Validée', rejetee: 'Rejetée', retour_agent: 'Retour agent',
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={24} />
              Carte des plaintes
            </h1>
            <p className="text-slate-500 text-sm mt-1">{filtered.length} plainte{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={loadPlaintes} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filtres</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Toutes catégories</option>
              {categories.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
            </select>
            <select
              value={filterUrg}
              onChange={(e) => setFilterUrg(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Toutes urgences</option>
              <option value="haute">Haute</option>
              <option value="moyenne">Moyenne</option>
              <option value="basse">Basse</option>
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Tous statuts</option>
              {statuts.map(s => <option key={s} value={s}>{STATUT_LABELS[s] || s}</option>)}
            </select>
            {(filterCat || filterUrg || filterStatut) && (
              <button
                onClick={() => { setFilterCat(''); setFilterUrg(''); setFilterStatut(''); }}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-2"
              >
                Réinitialiser
              </button>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>Haute</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Moyenne</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>Basse</span>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: '500px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
            </div>
          ) : (
            <MapContainer
              center={[36.7538, 3.0588]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((p, i) => {
                const coords = getCoords(p.localisation, i);
                const icon = URGENCE_ICONS[p.urgence] || URGENCE_ICONS.moyenne;
                return (
                  <Marker key={p.id} position={coords} icon={icon}>
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-400">#{p.id}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-800 mb-1">{p.titre}</h4>
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{p.description}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Catégorie:</span>
                            <span className="font-medium">{CAT_LABELS[p.categorie] || p.categorie}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Urgence:</span>
                            <span className={`font-medium ${p.urgence === 'haute' ? 'text-red-600' : p.urgence === 'moyenne' ? 'text-orange-600' : 'text-green-600'}`}>
                              {p.urgence.charAt(0).toUpperCase() + p.urgence.slice(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Statut:</span>
                            <span className="font-medium">{STATUT_LABELS[p.statut] || p.statut}</span>
                          </div>
                          {p.localisation && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Lieu:</span>
                              <span className="font-medium text-right max-w-[140px]">{p.localisation}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Date:</span>
                            <span>{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
