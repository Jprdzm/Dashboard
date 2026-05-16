import { useState, useEffect } from 'react';
import { Coins, TrendingUp, AlertCircle, Target, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

const NAV_ITEMS = [
  { to: '/finanzas', icon: TrendingUp, label: 'Reporte', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', hoverBorder: 'hover:border-green-400 dark:hover:border-green-500' },
  { to: '/deudas', icon: AlertCircle, label: 'Deudas', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', hoverBorder: 'hover:border-red-400 dark:hover:border-red-500' },
  { to: '/metas', icon: Target, label: 'Metas', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500' },
];

export default function FinanceCard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(() => isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('finanzas')
          .select('monto, tipo')
          .eq('user_id', user.id);
        if (cancelled) return;
        if (error) {
          console.error('[FinanceCard] Error al obtener balance:', error);
        } else {
          const bal = (data || []).reduce(
            (acc, t) => (t.tipo === 'ingreso' ? acc + t.monto : acc - t.monto),
            0,
          );
          setBalance(bal);
        }
      } catch (err) {
        if (!cancelled) console.error('[FinanceCard] Error inesperado:', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300 hover:shadow-sm flex flex-col space-y-4">
      <Link
        to="/finanzas"
        className="flex flex-col items-center text-center space-y-3 group"
      >
        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Coins size={24} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="font-semibold text-text-light dark:text-text-dark">
            Finanzas
          </h2>
          {loading ? (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Loader2 size={14} className="animate-spin text-textMuted-light dark:text-textMuted-dark" />
              <span className="text-xs text-textMuted-light dark:text-textMuted-dark">Cargando…</span>
            </div>
          ) : (
            <p
              className={`text-lg font-bold mt-1 ${
                balance >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {balance !== null ? formatCurrency(balance) : formatCurrency(0)}
            </p>
          )}
        </div>
      </Link>

      <div className="flex gap-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border border-transparent ${item.bg} ${item.hoverBorder} transition-all duration-200`}
          >
            <item.icon size={18} className={item.color} />
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
