import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const roleRoutes = {
    citoyen: '/citizen',
    agent: '/agent',
    secretaire_general: '/sg',
    administrateur: '/admin',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenue, ${user.prenom} !`);
      navigate(roleRoutes[user.role] || '/citizen');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ nom, prenom, email, password, telephone, adresse });
      toast.success('Compte créé ! Connectez-vous.');
      setIsRegister(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1e3a5f] via-[#2a4a72] to-[#1a3352]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12 text-white">
        <h1 className="text-5xl font-extrabold mb-4 leading-tight">
          Plainte<span className="text-orange-400">360</span>
        </h1>
        <p className="text-xl text-blue-200 mb-6 leading-relaxed">
          Plateforme intelligente de gestion des plaintes citoyennes
        </p>
        <div className="space-y-3">
          {[
            'Déposez vos plaintes via un chatbot intelligent',
            'Suivi en temps réel de vos réclamations',
            'Traitement automatisé et classification IA',
            'Communication transparente avec votre commune',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"></div>
              <p className="text-blue-100">{text}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {isRegister ? 'Créer un compte' : 'Connexion'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isRegister ? 'Inscrivez-vous pour déposer vos plaintes' : 'Accédez à votre espace'}
            </p>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text" placeholder="Nom" value={nom}
                      onChange={(e) => setNom(e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text" placeholder="Prénom" value={prenom}
                      onChange={(e) => setPrenom(e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="tel" placeholder="Téléphone" value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text" placeholder="Adresse" value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password" placeholder="Mot de passe" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-[#1e3a5f] text-white rounded-lg font-semibold hover:bg-[#152a45] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isRegister ? "S'inscrire" : 'Se connecter'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isRegister ? 'Déjà un compte ? Connectez-vous' : "Pas de compte ? Inscrivez-vous"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
