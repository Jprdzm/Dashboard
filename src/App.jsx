import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './pages/Dashboard';
import FinanzasPage from './pages/FinanzasPage';
import DeudasPage from './pages/DeudasPage';
import MetasPage from './pages/MetasPage';

function App() {
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

export default App;
