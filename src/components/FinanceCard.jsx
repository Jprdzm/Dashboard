import { TrendingUp, AlertCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/finanzas', icon: TrendingUp, label: 'Reporte', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', hoverBorder: 'hover:border-green-400 dark:hover:border-green-500' },
  { to: '/deudas', icon: AlertCircle, label: 'Deudas', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', hoverBorder: 'hover:border-red-400 dark:hover:border-red-500' },
  { to: '/metas', icon: Target, label: 'Metas', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500' },
];

export default function FinanceCard() {
  return (
    <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md transition-colors duration-300 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md space-y-3">
      <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">
        Finanzas
      </span>
      <div className="flex gap-2 justify-center">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg border border-transparent ${item.bg} ${item.hoverBorder} transition-all duration-200`}
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
