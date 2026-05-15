import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' });
}

export default function FinanceTracker() {
  const [transactions, setTransactions] = useLocalStorage('transactions', []);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');

  const balance = transactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
    0,
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    setTransactions((prev) => [
      { id: Date.now(), amount: parseFloat(amount), type, description, date: new Date().toISOString() },
      ...prev,
    ]);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300 hover:shadow-sm flex flex-col">
      <h2 className="font-semibold mb-3 text-text-light dark:text-text-dark">Finanzas</h2>

      <div className="text-center mb-4 pb-4 border-b border-border-light dark:border-border-dark">
        <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
          Balance General
        </span>
        <p
          className={`text-2xl font-bold mt-1 ${
            balance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(balance)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 mb-4">
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-1/2 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors duration-200"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-1/2 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors duration-200"
          >
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Mensualidad del gym"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors duration-200"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200 flex items-center gap-1"
          >
            <Plus size={16} />
          </button>
        </div>
      </form>

      <div className="flex-1">
        <h3 className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-2">
          Últimos Movimientos
        </h3>
        {transactions.length === 0 ? (
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark text-center py-4">
            No hay movimientos registrados
          </p>
        ) : (
          <ul className="space-y-1">
            {transactions.slice(0, 5).map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-light dark:bg-bg-dark transition-colors duration-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {t.type === 'income' ? (
                    <TrendingUp size={14} className="shrink-0 text-green-500" />
                  ) : (
                    <TrendingDown size={14} className="shrink-0 text-red-500" />
                  )}
                  <span className="text-sm text-text-light dark:text-text-dark truncate">
                    {t.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      t.type === 'income'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                  <span className="text-xs text-textMuted-light dark:text-textMuted-dark">
                    {formatDate(t.date)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
