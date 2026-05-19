import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, AlertTriangle, Target, CheckSquare, LogOut, Brain, X, PlaySquare } from 'lucide-react';
import supabase from '../services/supabaseClient';
import { useToast } from './Toast';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
  { to: '/deudas', icon: AlertTriangle, label: 'Deudas' },
  { to: '/metas', icon: Target, label: 'Metas' },
  { to: '/suscripciones', icon: PlaySquare, label: 'Suscripciones' },
  { to: '/habits', icon: CheckSquare, label: 'Hábitos' },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const addToast = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      addToast('Error al cerrar sesión: ' + error.message, 'error');
    } else {
      addToast('Sesión cerrada correctamente', 'success');
      navigate('/');
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-surface-light dark:bg-[#0B0F19]/95 backdrop-blur-xl border-r border-border-light dark:border-border-dark transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border-light dark:border-border-dark shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-text-light dark:text-text-dark">Second Brain</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border-light dark:border-border-dark mt-auto shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
