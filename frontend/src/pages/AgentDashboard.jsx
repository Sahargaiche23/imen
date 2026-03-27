import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import { MonthlyChart, CategoryPieChart, StatusBarChart, SatisfactionChart } from '../components/DashboardCharts';
import { FileText, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const { user } = useAuth();
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
    } catch {
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

  const urgentPlainte = plaintes.find(p => p.urgence === 'haute' && p.statut === 'soumise');

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Tableau de bord Agent
          </h1>
          <p className="text-slate-500 mt-1">Bienvenue, {user?.prenom} {user?.nom}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText} label="Total plaintes" value={stats?.total_plaintes || 0} color="blue" />
          <StatCard icon={Clock} label="En attente" value={stats?.en_attente || 0} color="orange" />
          <StatCard icon={AlertTriangle} label="Urgentes" value={stats?.urgentes || 0} color="red" />
          <StatCard icon={CheckCircle} label="Résolues ce mois" value={stats?.resolues || 0} color="green" />
        </div>

        {/* Urgent plainte highlight */}
        {urgentPlainte && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle size={12} /> URGENCE HAUTE
                  </span>
                  <span className="text-sm text-slate-500">Plainte #{urgentPlainte.id}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{urgentPlainte.titre}</h3>
                <p className="text-sm text-slate-600 mt-1">{urgentPlainte.description?.slice(0, 150)}...</p>
                {urgentPlainte.resume_ia && (
                  <div className="mt-3 bg-white/60 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-blue-700">Résumé IA</p>
                    <p className="text-sm text-blue-600">{urgentPlainte.resume_ia}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MonthlyChart data={stats?.par_mois} />
          <CategoryPieChart data={stats?.par_categorie} />
          <StatusBarChart data={stats?.par_statut} />
          <SatisfactionChart data={stats?.satisfaction} />
        </div>

        {/* Recent plaintes table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Plaintes récentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Urgence</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plaintes.slice(0, 8).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{p.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600"><CategorieLabel categorie={p.categorie} /></td>
                    <td className="px-6 py-4"><StatusBadge statut={p.statut} /></td>
                    <td className="px-6 py-4"><UrgenceBadge urgence={p.urgence} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
