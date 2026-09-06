import { useEffect, useState } from 'react';
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
  Calendar,
  GraduationCap,
  Menu,
  X,
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
  {
    to: '/calendario',
    icon: Calendar,
    label: 'Calendario',
    activeClass: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 dark:bg-cyan-500/15',
    dotClass: 'bg-cyan-500',
  },
  {
    to: '/calificaciones',
    icon: GraduationCap,
    label: 'Calificaciones',
    activeClass: 'bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400 dark:bg-fuchsia-500/15',
    dotClass: 'bg-fuchsia-500',
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      addToast('Error al cerrar sesión: ' + error.message, 'error');
    } else {
      addToast('Sesión cerrada correctamente', 'success');
      navigate('/');
    }
  };

  // Close the mobile drawer automatically if the viewport grows into the
  // desktop breakpoint (e.g. rotating a tablet, resizing a window) so it
  // never gets stuck open behind the now-visible pill nav.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handleChange = (e) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Escape closes the drawer for keyboard users.
  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

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

          {/* Nav - centered, desktop/tablet only (>=md). Mobile gets a hamburger + drawer. */}
          <nav className="hidden md:flex flex-1 justify-center overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-white/[0.04] rounded-2xl p-1 min-w-fit">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-soft-out hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? item.activeClass
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-white/[0.06]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={14} className="shrink-0" />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${item.dotClass}`} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Mobile spacer pushes actions to the right when the pill nav is hidden */}
          <div className="flex-1 md:hidden" />

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              className="md:hidden flex items-center justify-center w-11 h-11 -mr-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-[0.95] transition-all duration-200 ease-soft-out"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-[0.95] transition-all duration-200 ease-soft-out"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile backdrop — click outside the drawer to close it */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={`md:hidden fixed inset-0 z-[35] transition-opacity duration-200 ease-soft-out ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer — collapsed nav, real labels, 44px touch targets */}
      <div
        id="mobile-nav-menu"
        className={`md:hidden absolute top-full inset-x-0 z-40 origin-top transition-all duration-200 ease-soft-out ${
          menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <nav className="mx-3 mt-2 mb-3 p-2 flex flex-col gap-1 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md shadow-soft-lg dark:shadow-soft-dark-lg">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 min-h-11 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-soft-out ${
                  isActive
                    ? item.activeClass
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className={`ml-auto w-1.5 h-1.5 rounded-full ${item.dotClass}`} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
