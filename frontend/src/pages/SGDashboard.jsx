import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { StatusBadge, UrgenceBadge, CategorieLabel } from '../components/StatusBadge';
import { MonthlyChart, CategoryPieChart, StatusBarChart, SatisfactionChart } from '../components/DashboardCharts';
import { FileText, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SGDashboard() {
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

  const enValidation = plaintes.filter(p => p.statut === 'traitee').length;
  const totalTraitees = plaintes.filter(p => ['validee', 'traitee', 'rejetee'].includes(p.statut)).length;
  const tauxSatisfaction = stats?.total_plaintes > 0
    ? Math.round((stats?.resolues / stats?.total_plaintes) * 100)
    : 0;

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Validation SG</h1>
          <p className="text-slate-500 mt-1">Bienvenue, {user?.prenom} {user?.nom}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock} label="En attente validation" value={enValidation} color="orange" />
          <StatCard icon={FileText} label="Traitées ce mois" value={totalTraitees} color="blue" />
          <StatCard icon={CheckCircle} label="Validées" value={stats?.resolues || 0} color="green" />
          <StatCard icon={BarChart3} label="Taux satisfaction" value={`${tauxSatisfaction}%`} color="purple" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MonthlyChart data={stats?.par_mois} />
          <CategoryPieChart data={stats?.par_categorie} />
          <StatusBarChart data={stats?.par_statut} />
          <SatisfactionChart data={stats?.satisfaction} />
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Activité récente</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Agent</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plaintes.slice(0, 10).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{p.id}</td>
                    <td className="px-6 py-4 text-sm"><CategorieLabel categorie={p.categorie} /></td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {p.agent ? `${p.agent.prenom} ${p.agent.nom}` : '-'}
                    </td>
                    <td className="px-6 py-4"><StatusBadge statut={p.statut} /></td>
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
