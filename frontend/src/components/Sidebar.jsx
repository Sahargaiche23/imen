import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  LayoutDashboard, MessageSquare, FileText, Users, Settings,
  LogOut, Shield, CheckCircle, BarChart3, HelpCircle, Bell, Map
} from 'lucide-react';

const menuItems = {
  citoyen: [
    { path: '/citizen', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/citizen/chatbot', label: 'Déposer une plainte', icon: MessageSquare },
    { path: '/citizen/plaintes', label: 'Mes plaintes', icon: FileText },
    { path: '/citizen/notifications', label: 'Notifications', icon: Bell, badge: true },
    { path: '/citizen/guide', label: 'Guide', icon: HelpCircle },
  ],
  agent: [
    { path: '/agent', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/agent/plaintes', label: 'Plaintes', icon: FileText },
    { path: '/agent/notifications', label: 'Notifications', icon: Bell, badge: true },
    { path: '/agent/guide', label: 'Guide', icon: HelpCircle },
  ],
  secretaire_general: [
    { path: '/sg', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/sg/validation', label: 'Validation', icon: CheckCircle },
    { path: '/sg/notifications', label: 'Notifications', icon: Bell, badge: true },
    { path: '/sg/carte', label: 'Carte', icon: Map },
    { path: '/sg/guide', label: 'Guide', icon: HelpCircle },
  ],
  administrateur: [
    { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Utilisateurs', icon: Users },
    { path: '/admin/plaintes', label: 'Plaintes', icon: FileText },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell, badge: true },
    { path: '/admin/carte', label: 'Carte', icon: Map },
    { path: '/admin/guide', label: 'Guide', icon: HelpCircle },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = menuItems[user?.role] || [];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const roleLabels = {
    citoyen: 'Citoyen',
    agent: 'Agent Municipal',
    secretaire_general: 'Secrétaire Général',
    administrateur: 'Administrateur',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#1e3a5f] min-h-screen flex flex-col text-white shadow-xl">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-wide">Plainte360</h1>
        <p className="text-xs text-blue-200 mt-1">{roleLabels[user?.role]}</p>
      </div>

      <nav className="flex-1 py-4">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user?.role}` || item.path === '/citizen' || item.path === '/agent' || item.path === '/sg' || item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 border-r-4 border-orange-400 text-white font-semibold'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
            {item.badge && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center text-sm font-bold text-white">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
