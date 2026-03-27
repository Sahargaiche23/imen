import { useState, useEffect } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import {
  Bell, CheckCircle, RotateCcw, MessageSquare, ThumbsUp, ThumbsDown,
  Play, AlertTriangle, Check, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  nouvelle_reponse: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  prise_en_charge: { icon: Play, color: 'text-orange-600', bg: 'bg-orange-50' },
  validation_sg: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  reponse_validee: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  retour_sg: { icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
  feedback_citoyen: { icon: ThumbsUp, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: 1 } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, lu: 1 })));
      toast.success('Toutes les notifications marquées comme lues');
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Bell size={24} />
                Notifications
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 text-sm text-[#1e3a5f] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-medium"
              >
                <CheckCheck size={16} />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a5f]"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Bell size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">Aucune notification</p>
              <p className="text-xs text-slate-400 mt-1">Les notifications apparaîtront ici quand il y aura de l'activité</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.nouvelle_reponse;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.lu && markRead(n.id)}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${
                      n.lu
                        ? 'bg-white border-slate-100 opacity-70'
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold ${n.lu ? 'text-slate-500' : 'text-slate-800'}`}>
                            {n.titre}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                            {!n.lu && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mt-0.5 ${n.lu ? 'text-slate-400' : 'text-slate-600'}`}>
                          {n.message}
                        </p>
                        {n.plainte_id && (
                          <p className="text-xs text-slate-400 mt-1">Plainte #{n.plainte_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
