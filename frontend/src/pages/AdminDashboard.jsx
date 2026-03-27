import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { StatusBadge, CategorieLabel } from '../components/StatusBadge';
import { MonthlyChart, CategoryPieChart, StatusBarChart, SatisfactionChart } from '../components/DashboardCharts';
import { Users, FileText, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plaintes, setPlaintes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, plaintesRes] = await Promise.all([
        api.get('/plaintes/stats'),
        api.get('/users'),
        api.get('/plaintes'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
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

  const roleLabels = {
    citoyen: 'Citoyens',
    agent: 'Agents',
    secretaire_general: 'SG',
    administrateur: 'Admins',
  };

  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
          <p className="text-slate-500 mt-1">Panneau d'administration Plainte360</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Utilisateurs" value={users.length} color="blue" />
          <StatCard icon={FileText} label="Total plaintes" value={stats?.total_plaintes || 0} color="orange" />
          <StatCard icon={AlertTriangle} label="Urgentes" value={stats?.urgentes || 0} color="red" />
          <StatCard icon={CheckCircle} label="Résolues" value={stats?.resolues || 0} color="green" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MonthlyChart data={stats?.par_mois} />
          <CategoryPieChart data={stats?.par_categorie} />
          <StatusBarChart data={stats?.par_statut} />
          <SatisfactionChart data={stats?.satisfaction} />
        </div>

        {/* Users by role */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-[#1e3a5f]" />
            Utilisateurs par rôle
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-700">{usersByRole[role] || 0}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent plaintes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Dernières plaintes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Titre</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Citoyen</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plaintes.slice(0, 8).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{p.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 max-w-xs truncate">{p.titre}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {p.citoyen ? `${p.citoyen.prenom} ${p.citoyen.nom}` : '-'}
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
