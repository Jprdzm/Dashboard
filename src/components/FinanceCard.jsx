import { useMemo } from 'react';
import { TrendingUp, AlertCircle, Target, Wallet, PiggyBank, CircleDollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { useFinanceSummary } from '../hooks/useFinanceSummary';

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
    color: 'text-neutral-800 dark:text-neutral-200',
    bg: 'bg-neutral-100 dark:bg-neutral-800/40',
    border: 'border-neutral-300 dark:border-neutral-700',
    hover: 'hover:bg-neutral-200 dark:hover:bg-neutral-800/60',
  },
];

function fmtMoney(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

function StatRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-bg-light/60 dark:bg-bg-dark/40 border border-border-light dark:border-border-dark">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={14} className="text-textMuted-light dark:text-textMuted-dark shrink-0" />
        <span className="text-xs text-textMuted-light dark:text-textMuted-dark truncate">{label}</span>
      </div>
      <span className={`text-sm font-bold tabular-nums shrink-0 ${valueColor}`}>{value}</span>
    </div>
  );
}

export default function FinanceCard() {
  const [debts] = useIndexedDB('debts', []);
  const [goals] = useIndexedDB('goals', []);
  const { remanente, loading: loadingFinance, hasData: hasFinanceData } = useFinanceSummary();

  const safeDebts = Array.isArray(debts) ? debts : [];

  const deudaActiva = useMemo(() => {
    const list = Array.isArray(debts) ? debts : [];
    return list.reduce((sum, d) => {
      const total = Number(d?.totalAmount) || 0;
      const paid = Number(d?.paidAmount) || 0;
      const remaining = total - paid;
      return remaining > 0 ? sum + remaining : sum;
    }, 0);
  }, [debts]);

  const metasProgreso = useMemo(() => {
    const list = Array.isArray(goals) ? goals : [];
    if (list.length === 0) return null;
    const target = list.reduce((s, g) => s + (Number(g?.targetAmount) || 0), 0);
    const current = list.reduce((s, g) => s + (Number(g?.currentAmount) || 0), 0);
    if (target <= 0) return null;
    return Math.min(100, (current / target) * 100);
  }, [goals]);

  const deudaLabel = safeDebts.length === 0 ? '—' : fmtMoney(deudaActiva);
  const remanenteLabel = !hasFinanceData || loadingFinance ? '—' : fmtMoney(remanente);
  const remanenteColor = !hasFinanceData || loadingFinance
    ? 'text-text-light dark:text-text-dark'
    : remanente >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400';
  const metasLabel = metasProgreso === null ? '—' : `${metasProgreso.toFixed(0)}%`;

  return (
    <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-all duration-300 ease-soft-out group flex flex-col">
      <div className="flex flex-col items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300 ease-soft-out">
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

        <div className="w-full space-y-2">
          <StatRow
            icon={AlertCircle}
            label="Deuda activa"
            value={deudaLabel}
            valueColor="text-rose-600 dark:text-rose-400"
          />
          <StatRow
            icon={CircleDollarSign}
            label="Remanente del mes"
            value={remanenteLabel}
            valueColor={remanenteColor}
          />
          <StatRow
            icon={PiggyBank}
            label="Progreso de metas"
            value={metasLabel}
            valueColor="text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <div className="flex gap-2.5 w-full">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 flex-1 py-2.5 px-2 rounded-xl border ${item.border} ${item.bg} ${item.hover} transition-all duration-200 ease-soft-out hover:-translate-y-0.5 active:scale-[0.95]`}
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
