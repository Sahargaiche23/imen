import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import { MonthlyChart, CategoryPieChart, StatusBarChart } from '../components/DashboardCharts';
import { FileText, Clock, CheckCircle, AlertTriangle, MessageSquare, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, plaintesRes] = await Promise.all([
        api.get('/plaintes/stats'),
        api.get('/plaintes'),
      ]);
      setStats(statsRes.data);
      setPlaintes(plaintesRes.data);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Bonjour, {user?.prenom} !
          </h1>
          <p className="text-slate-500 mt-1">Bienvenue sur votre espace citoyen</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText} label="Total plaintes" value={stats?.total_plaintes || 0} color="blue" />
          <StatCard icon={Clock} label="En attente" value={stats?.en_attente || 0} color="orange" />
          <StatCard icon={AlertTriangle} label="En cours" value={stats?.en_cours || 0} color="purple" />
          <StatCard icon={CheckCircle} label="Résolues" value={stats?.resolues || 0} color="green" />
        </div>

        {/* Quick action */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/citizen/chatbot')}
            className="flex items-center gap-3 bg-gradient-to-r from-[#1e3a5f] to-[#2a4a72] text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
          >
            <MessageSquare size={24} />
            <div className="text-left">
              <p className="font-semibold">Déposer une nouvelle plainte</p>
              <p className="text-sm text-blue-200">Via notre chatbot intelligent</p>
            </div>
          </button>
        </div>

        {/* Charts */}
        {stats?.total_plaintes > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <MonthlyChart data={stats?.par_mois} />
            <StatusBarChart data={stats?.par_statut} />
          </div>
        )}

        {/* Recent plaintes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Mes plaintes récentes</h2>
          </div>
          {plaintes.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucune plainte pour le moment</p>
              <p className="text-sm mt-1">Déposez votre première plainte via le chatbot</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Titre</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Urgence</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plaintes.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">#{p.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800 max-w-xs truncate">{p.titre}</td>
                      <td className="px-6 py-4 text-sm text-slate-600"><CategorieLabel categorie={p.categorie} /></td>
                      <td className="px-6 py-4"><UrgenceBadge urgence={p.urgence} /></td>
                      <td className="px-6 py-4"><StatusBadge statut={p.statut} /></td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
