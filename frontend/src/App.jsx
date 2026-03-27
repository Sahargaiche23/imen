import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import CitizenChatbot from './pages/CitizenChatbot';
import CitizenPlaintes from './pages/CitizenPlaintes';
import AgentDashboard from './pages/AgentDashboard';
import AgentPlaintes from './pages/AgentPlaintes';
import SGDashboard from './pages/SGDashboard';
import SGValidation from './pages/SGValidation';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPlaintes from './pages/AdminPlaintes';
import Guide from './pages/Guide';
import Notifications from './pages/Notifications';
import CartePlaintes from './pages/CartePlaintes';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Citoyen */}
          <Route path="/citizen" element={
            <ProtectedRoute roles={['citoyen']}>
              <CitizenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/citizen/chatbot" element={
            <ProtectedRoute roles={['citoyen']}>
              <CitizenChatbot />
            </ProtectedRoute>
          } />
          <Route path="/citizen/plaintes" element={
            <ProtectedRoute roles={['citoyen']}>
              <CitizenPlaintes />
            </ProtectedRoute>
          } />
          <Route path="/citizen/notifications" element={
            <ProtectedRoute roles={['citoyen']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/citizen/guide" element={
            <ProtectedRoute roles={['citoyen']}>
              <Guide />
            </ProtectedRoute>
          } />

          {/* Agent */}
          <Route path="/agent" element={
            <ProtectedRoute roles={['agent']}>
              <AgentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/agent/plaintes" element={
            <ProtectedRoute roles={['agent']}>
              <AgentPlaintes />
            </ProtectedRoute>
          } />
          <Route path="/agent/notifications" element={
            <ProtectedRoute roles={['agent']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/agent/guide" element={
            <ProtectedRoute roles={['agent']}>
              <Guide />
            </ProtectedRoute>
          } />

          {/* Secrétaire Général */}
          <Route path="/sg" element={
            <ProtectedRoute roles={['secretaire_general']}>
              <SGDashboard />
            </ProtectedRoute>
          } />
          <Route path="/sg/validation" element={
            <ProtectedRoute roles={['secretaire_general']}>
              <SGValidation />
            </ProtectedRoute>
          } />
          <Route path="/sg/notifications" element={
            <ProtectedRoute roles={['secretaire_general']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/sg/carte" element={
            <ProtectedRoute roles={['secretaire_general']}>
              <CartePlaintes />
            </ProtectedRoute>
          } />
          <Route path="/sg/guide" element={
            <ProtectedRoute roles={['secretaire_general']}>
              <Guide />
            </ProtectedRoute>
          } />

          {/* Administrateur */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['administrateur']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['administrateur']}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/plaintes" element={
            <ProtectedRoute roles={['administrateur']}>
              <AdminPlaintes />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute roles={['administrateur']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/admin/carte" element={
            <ProtectedRoute roles={['administrateur']}>
              <CartePlaintes />
            </ProtectedRoute>
          } />
          <Route path="/admin/guide" element={
            <ProtectedRoute roles={['administrateur']}>
              <Guide />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
