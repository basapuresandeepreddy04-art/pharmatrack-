import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MedicinesPage from './pages/MedicinesPage';
import SalesPage from './pages/SalesPage';
import AlertsPage from './pages/AlertsPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="text-slate-400">Loading…</span></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="dashboard"  element={<DashboardPage />} />
          <Route path="medicines"  element={<MedicinesPage />} />
          <Route path="sales"      element={<SalesPage />} />
          <Route path="alerts"     element={<AlertsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
