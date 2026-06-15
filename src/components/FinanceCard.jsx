import { TrendingUp, AlertCircle, Target, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinanceCard() {
  return (
    <div className="card">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary-dark-mode/20 flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-primary/20 transition-all duration-300">
          <Wallet size={20} className="text-primary dark:text-primary-dark-mode" />
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-text-primary dark:text-text-primary text-sm">
            Centro Financiero
          </h2>
          <p className="text-muted/60 dark:text-muted/400 mt-0.5">
            Reportes, deudas y metas
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <Link
            to="/finanzas"
            className="flex flex-col items-center gap-2 flex-1 p-4 rounded-xl border border-primary/20 dark:border-primary-dark-mode/20 bg-primary/5 dark:bg-primary-dark-mode/10 hover:bg-primary/10 dark:hover:bg-primary-dark-mode/20 transition-all duration-200 active:scale-95"
          >
            <TrendingUp size={18} className="text-primary dark:text-primary-dark-mode" />
            <span className="text-[11px] font-semibold tracking-wide text-muted/60 dark:text-muted/400 uppercase">
              Reporte
            </span>
          </Link>

          <Link
            to="/deudas"
            className="flex flex-col items-center gap-2 flex-1 p-4 rounded-xl border border-danger/20 dark:border-danger-dark-mode/20 bg-danger/5 dark:bg-danger-dark-mode/10 hover:bg-danger/10 dark:hover:bg-danger-dark-mode/20 transition-all duration-200 active:scale-95"
          >
            <AlertCircle size={18} className="text-danger dark:text-danger-dark-mode" />
            <span className="text-[11px] font-semibold tracking-wide text-muted/60 dark:text-muted/400 uppercase">
              Deudas
            </span>
          </Link>

          <Link
            to="/metas"
            className="flex flex-col items-center gap-2 flex-1 p-4 rounded-xl border border-info/20 dark:border-info-dark-mode/20 bg-info/5 dark:bg-info-dark-mode/10 hover:bg-info/10 dark:hover:bg-info-dark-mode/20 transition-all duration-200 active:scale-95"
          >
            <Target size={18} className="text-info dark:text-info-dark-mode" />
            <span className="text-[11px] font-semibold tracking-wide text-muted/60 dark:text-muted/400 uppercase">
              Metas
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
