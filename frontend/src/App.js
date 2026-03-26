import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import PnL from './pages/PnL';
import ExpiryAlerts from './pages/ExpiryAlerts';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import './index.css';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={
        <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
      } />
      <Route path="/inventory" element={
        <PrivateRoute roles={['owner','manager']}><AppLayout><Inventory /></AppLayout></PrivateRoute>
      } />
      <Route path="/billing" element={
        <PrivateRoute><AppLayout><Billing /></AppLayout></PrivateRoute>
      } />
      <Route path="/suppliers" element={
        <PrivateRoute roles={['owner','manager']}><AppLayout><Suppliers /></AppLayout></PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute roles={['owner','manager']}><AppLayout><Reports /></AppLayout></PrivateRoute>
      } />
      <Route path="/pnl" element={
        <PrivateRoute roles={['owner']}><AppLayout><PnL /></AppLayout></PrivateRoute>
      } />
      <Route path="/expiry" element={
        <PrivateRoute roles={['owner','manager']}><AppLayout><ExpiryAlerts /></AppLayout></PrivateRoute>
      } />
      <Route path="/notifications" element={
        <PrivateRoute roles={['owner']}><AppLayout><Notifications /></AppLayout></PrivateRoute>
      } />
      <Route path="/users" element={
        <PrivateRoute roles={['owner']}><AppLayout><Users /></AppLayout></PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)', fontFamily: 'DM Sans', fontSize: 14 },
            success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
