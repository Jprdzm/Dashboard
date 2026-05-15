import React from 'react';
import { Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIndexedDB } from '../hooks/useIndexedDB';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

export default function FinanceCard() {
  const [transactions] = useIndexedDB('transactions', []);

  const balance = transactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
    0,
  );

  return (
    <Link
      to="/finanzas"
      className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark group transition-all duration-300 hover:shadow-md hover:border-green-400 dark:hover:border-green-500 flex flex-col items-center justify-center text-center space-y-3"
    >
      <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Coins size={24} className="text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h2 className="font-semibold text-text-light dark:text-text-dark">
          Finanzas
        </h2>
        <p
          className={`text-lg font-bold mt-1 ${
            balance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(balance)}
        </p>
      </div>
    </Link>
  );
}
