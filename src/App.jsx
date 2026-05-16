import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import ThemeToggle from './components/ThemeToggle';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FinanzasPage from './pages/FinanzasPage';
import DeudasPage from './pages/DeudasPage';
import MetasPage from './pages/MetasPage';

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
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/finanzas" element={<FinanzasPage />} />
        <Route path="/deudas" element={<DeudasPage />} />
        <Route path="/metas" element={<MetasPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
