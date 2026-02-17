import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Unlock from './pages/Unlock';
import Vault from './pages/Vault';
import AddEntry from './pages/AddEntry';
import EditEntry from './pages/EditEntry';
import Settings from './pages/Settings';
import Recovery from './pages/Recovery';

function RequireAuth({ children }) {
  const { token, user, cryptoKey, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)] px-4">
        <div className="animate-pulse text-[var(--text-muted)]">Yükleniyor…</div>
      </div>
    );
  }
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!cryptoKey) return <Unlock />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/recovery" element={<Recovery />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Vault />} />
        <Route path="add" element={<AddEntry />} />
        <Route path="edit/:id" element={<EditEntry />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
