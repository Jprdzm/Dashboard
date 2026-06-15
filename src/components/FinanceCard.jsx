import { TrendingUp, AlertCircle, Target, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/finanzas',
    icon: TrendingUp,
    label: 'Reporte',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/25',
    border: 'border-emerald-200 dark:border-emerald-800',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
  },
  {
    to: '/deudas',
    icon: AlertCircle,
    label: 'Deudas',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/25',
    border: 'border-rose-200 dark:border-rose-800',
    hover: 'hover:bg-rose-100 dark:hover:bg-rose-900/40',
  },
  {
    to: '/metas',
    icon: Target,
    label: 'Metas',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/25',
    border: 'border-violet-200 dark:border-violet-800',
    hover: 'hover:bg-violet-100 dark:hover:bg-violet-900/40',
  },
];

export default function FinanceCard() {
  return (
    <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md transition-all duration-300 hover:shadow-md group">
      <div className="flex flex-col items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300">
          <Wallet size={20} className="text-white" />
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
            Centro Financiero
          </h2>
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-0.5">
            Reportes, deudas y metas
          </p>
        </div>

        <div className="flex gap-2.5 w-full">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 flex-1 py-2.5 px-2 rounded-xl border ${item.border} ${item.bg} ${item.hover} transition-all duration-200 active:scale-95`}
            >
              <item.icon size={18} className={item.color} />
              <span className={`text-[11px] font-semibold tracking-wide uppercase ${item.color}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
