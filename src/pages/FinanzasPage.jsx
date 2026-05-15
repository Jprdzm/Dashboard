import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

const CATEGORIES = [
  'Estudios',
  'Gimnasio',
  'Comida',
  'Transporte',
  'Entretenimiento',
  'Vivienda',
  'Salud',
  'Otros',
];

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function FinanzasPage() {
  const [transactions, setTransactions] = useIndexedDB('transactions', []);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Otros');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('newest');

  const balance = useMemo(
    () =>
      transactions.reduce(
        (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
        0,
      ),
    [transactions],
  );

  const monthlyData = useMemo(() => {
    const groups = {};
    transactions.forEach((t) => {
      const key = getMonthKey(t.date);
      if (!groups[key]) groups[key] = { income: 0, expense: 0 };
      if (t.type === 'income') groups[key].income += t.amount;
      else groups[key].expense += t.amount;
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6);
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Otros';
        totals[cat] = (totals[cat] || 0) + t.amount;
      });
    const max = Math.max(...Object.values(totals), 1);
    return { totals, max };
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterCategory !== 'Todos') {
      list = list.filter((t) => (t.category || 'Otros') === filterCategory);
    }
    list.sort((a, b) =>
      sortOrder === 'newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date),
    );
    return list;
  }, [transactions, filterCategory, sortOrder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    setTransactions((prev) => [
      {
        id: Date.now(),
        amount: parseFloat(amount),
        type,
        description,
        category,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    setAmount('');
    setDescription('');
    setCategory('Otros');
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const totalIncome = useMemo(
    () => transactions.reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc), 0),
    [transactions],
  );
  const totalExpenses = useMemo(
    () => transactions.reduce((acc, t) => (t.type === 'expense' ? acc + t.amount : acc), 0),
    [transactions],
  );

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8 text-text-light dark:text-text-dark">
          Finanzas
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
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
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Ingresos
            </span>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Gastos
            </span>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        {monthlyData.length > 0 && (
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
            <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
              Ingresos vs Gastos por Mes
            </h2>
            <div className="space-y-3">
              {monthlyData.map(([month, data]) => {
                const maxVal = Math.max(data.income, data.expenses, 1);
                return (
                  <div key={month}>
                    <div className="flex justify-between text-xs text-textMuted-light dark:text-textMuted-dark mb-1">
                      <span>{month}</span>
                      <span>
                        I: {formatCurrency(data.income)} &middot; G:{' '}
                        {formatCurrency(data.expense)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${(data.income / maxVal) * 100}%` }}
                        />
                      </div>
                      <div className="h-2.5 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{ width: `${(data.expense / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Object.keys(categoryTotals.totals).length > 0 && (
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
            <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
              Gastos por Categoría
            </h2>
            <div className="space-y-2">
              {CATEGORIES.filter(
                (c) => (categoryTotals.totals[c] || 0) > 0,
              ).map((cat) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs text-textMuted-light dark:text-textMuted-dark mb-1">
                    <span>{cat}</span>
                    <span>{formatCurrency(categoryTotals.totals[cat])}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{
                        width: `${(categoryTotals.totals[cat] / categoryTotals.max) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
          <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
            Nuevo Movimiento
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Monto"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mensualidad del gym"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>
          </form>
        </div>

        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
              Historial
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-textMuted-light dark:text-textMuted-dark" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                <option value="Todos">Todas las categorías</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-textMuted-light dark:text-textMuted-dark text-center py-8">
              No hay movimientos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-2 font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 font-medium">Descripción</th>
                    <th className="text-left py-2 px-2 font-medium hidden sm:table-cell">
                      Categoría
                    </th>
                    <th className="text-right py-2 pl-2 font-medium">Monto</th>
                    <th className="text-right py-2 pl-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border-light dark:border-border-dark hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
                    >
                      <td className="py-2.5 pr-2 text-textMuted-light dark:text-textMuted-dark whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-2.5 px-2 text-text-light dark:text-text-dark">
                        {t.description}
                      </td>
                      <td className="py-2.5 px-2 text-textMuted-light dark:text-textMuted-dark hidden sm:table-cell">
                        {t.category || 'Otros'}
                      </td>
                      <td
                        className={`py-2.5 pl-2 text-right font-medium tabular-nums whitespace-nowrap ${
                          t.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
