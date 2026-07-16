import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Landing from './pages/Landing';
import { ToastProvider } from './components/ui/Toast';
import { ResultsProvider } from './context/ResultsContext';
import { Loader2 } from 'lucide-react';
import './App.css';

function MainApp() {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 select-none">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400 font-medium tracking-wide">Booting CareerPilot AI...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <AuthPage defaultIsLogin={true} />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <AuthPage defaultIsLogin={false} />} />
      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ResultsProvider>
            <MainApp />
          </ResultsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
