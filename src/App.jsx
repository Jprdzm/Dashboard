import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';
import OnlineStatus from './components/OnlineStatus';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FinanzasPage from './pages/FinanzasPage';
import DeudasPage from './pages/DeudasPage';
import MetasPage from './pages/MetasPage';
import HabitsPage from './pages/HabitsPage';
import SuscripcionesPage from './pages/SuscripcionesPage';

function AppShell() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finanzas" element={<FinanzasPage />} />
          <Route path="/deudas" element={<DeudasPage />} />
          <Route path="/metas" element={<MetasPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/suscripciones" element={<SuscripcionesPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
        <OnlineStatus />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
