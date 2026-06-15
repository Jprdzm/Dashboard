import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  AlertTriangle,
  Target,
  CheckSquare,
  Brain,
  LogOut,
  PlaySquare,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import supabase from '../services/supabaseClient';
import { useToast } from './Toast';

const NAV = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    activeClass: 'bg-blue-500/12 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15',
    dotClass: 'bg-blue-500',
  },
  {
    to: '/finanzas',
    icon: Wallet,
    label: 'Finanzas',
    activeClass: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15',
    dotClass: 'bg-emerald-500',
  },
  {
    to: '/deudas',
    icon: AlertTriangle,
    label: 'Deudas',
    activeClass: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 dark:bg-rose-500/15',
    dotClass: 'bg-rose-500',
  },
  {
    to: '/metas',
    icon: Target,
    label: 'Metas',
    activeClass: 'bg-violet-500/12 text-violet-600 dark:text-violet-400 dark:bg-violet-500/15',
    dotClass: 'bg-violet-500',
  },
  {
    to: '/suscripciones',
    icon: PlaySquare,
    label: 'Suscripciones',
    activeClass: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 dark:bg-amber-500/15',
    dotClass: 'bg-amber-500',
  },
  {
    to: '/habits',
    icon: CheckSquare,
    label: 'Hábitos',
    activeClass: 'bg-teal-500/12 text-teal-600 dark:text-teal-400 dark:bg-teal-500/15',
    dotClass: 'bg-teal-500',
  },
];

export default function Navbar() {
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
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <Brain size={15} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block text-slate-800 dark:text-slate-100">
              Second Brain
            </span>
          </div>

          {/* Nav - centered */}
          <nav className="flex-1 flex justify-center overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-white/[0.04] rounded-2xl p-1 min-w-fit">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? item.activeClass
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-white/[0.06]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={14} className="shrink-0" />
                      <span className="hidden md:inline">{item.label}</span>
                      {isActive && (
                        <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${item.dotClass}`} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
