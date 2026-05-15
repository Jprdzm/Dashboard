import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle, PiggyBank, BadgeInfo } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatMonths(m) {
  if (m < 12) return `${m} meses`;
  const years = Math.floor(m / 12);
  const months = m % 12;
  return months > 0 ? `${years} año${years > 1 ? 's' : ''} ${months} meses` : `${years} año${years > 1 ? 's' : ''}`;
}

function snowballSimulation(debts, extraPerMonth) {
  if (!debts.length || extraPerMonth <= 0) return null;

  let simulation = debts.map((d) => ({
    id: d.id,
    name: d.name,
    remaining: d.totalAmount - (d.paidAmount || 0),
    minPayment: d.minimumPayment,
    rate: d.interestRate,
    originalRemaining: d.totalAmount - (d.paidAmount || 0),
  }));

  simulation.sort((a, b) => a.remaining - b.remaining);

  let month = 0;
  const schedule = [];
  const maxMonths = 600;

  while (month < maxMonths) {
    simulation.forEach((d) => {
      if (d.remaining > 0) {
        d.remaining *= 1 + d.rate / 100 / 12;
      }
    });

    let available = extraPerMonth;
    let minTotal = 0;

    simulation.forEach((d) => {
      if (d.remaining > 0) {
        const payment = Math.min(d.minPayment, d.remaining);
        d.remaining -= payment;
        minTotal += payment;
      }
    });

    let freedMin = 0;
    simulation.forEach((d) => {
      if (d.remaining <= 0 && d.minPayment > 0) {
        freedMin += d.minPayment;
      }
    });

    available += freedMin;

    for (const d of simulation) {
      if (d.remaining > 0) {
        const extra = Math.min(available, d.remaining);
        d.remaining -= extra;
        available -= extra;
        if (d.remaining <= 0.01) d.remaining = 0;
      }
    }

    const active = simulation.filter((d) => d.remaining > 0.01);
    schedule.push({
      month: month + 1,
      activeCount: active.length,
      totalRemaining: active.reduce((s, d) => s + d.remaining, 0),
      debtsStatus: simulation.map((d) => ({
        id: d.id,
        name: d.name,
        remaining: Math.max(0, d.remaining),
        paid: d.originalRemaining - Math.max(0, d.remaining),
      })),
    });

    if (active.length === 0) break;
    month++;
  }

  const totalPaid = simulation.reduce((s, d) => s + d.originalRemaining, 0);

  return {
    totalMonths: month + 1,
    totalPaid,
    schedule,
  };
}

export default function DeudasPage() {
  const [debts, setDebts] = useIndexedDB('debts', []);
  const [monthlyIncome, setMonthlyIncome] = useIndexedDB('monthlyIncome', 0);
  const [extraPerMonth, setExtraPerMonth] = useState(0);

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [creditor, setCreditor] = useState('');

  const totalDebt = useMemo(
    () => debts.reduce((s, d) => s + (d.totalAmount - (d.paidAmount || 0)), 0),
    [debts],
  );

  const totalOriginal = useMemo(
    () => debts.reduce((s, d) => s + d.totalAmount, 0),
    [debts],
  );

  const totalPaidSoFar = useMemo(
    () => debts.reduce((s, d) => s + (d.paidAmount || 0), 0),
    [debts],
  );

  const debtRatio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0;

  const snowballResult = useMemo(
    () => snowballSimulation(debts, extraPerMonth),
    [debts, extraPerMonth],
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !totalAmount || !minimumPayment) return;

    setDebts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        totalAmount: parseFloat(totalAmount),
        interestRate: parseFloat(interestRate) || 0,
        minimumPayment: parseFloat(minimumPayment),
        creditor: creditor || name,
        paidAmount: 0,
      },
    ]);
    setName('');
    setTotalAmount('');
    setInterestRate('');
    setMinimumPayment('');
    setCreditor('');
  };

  const handleDelete = (id) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const handlePaidChange = (id, value) => {
    const amt = parseFloat(value);
    if (isNaN(amt)) return;
    setDebts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, paidAmount: Math.min(Math.max(0, amt), d.totalAmount) } : d,
      ),
    );
  };

  const totalMinPayments = useMemo(
    () => debts.reduce((s, d) => s + d.minimumPayment, 0),
    [debts],
  );

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <Link
          to="/finanzas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Volver a Finanzas
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-8 text-text-light dark:text-text-dark">
          Control de Deudas
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Deuda Total
            </span>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Pagado
            </span>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {formatCurrency(totalPaidSoFar)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Deudas Activas
            </span>
            <p className="text-2xl font-bold mt-1 text-text-light dark:text-text-dark">
              {debts.length}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Pago Mínimo Total
            </span>
            <p className="text-2xl font-bold mt-1 text-text-light dark:text-text-dark">
              {formatCurrency(totalMinPayments)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BadgeInfo size={16} className="text-blue-500" />
            <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
              Indicador de Salud Financiera
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1">
                Ingresos Mensuales
              </label>
              <input
                type="number"
                min="0"
                placeholder="Tu ingreso mensual"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide block mb-1">
                Ratio de Endeudamiento
              </span>
              <span
                className={`text-2xl font-bold ${
                  debtRatio > 50
                    ? 'text-red-600 dark:text-red-400'
                    : debtRatio > 30
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                }`}
              >
                {debtRatio.toFixed(1)}%
              </span>
            </div>
            {debtRatio > 30 && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  debtRatio > 50
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                }`}
              >
                <AlertTriangle size={16} />
                {debtRatio > 50
                  ? 'Crítico — tu deuda supera la mitad de tus ingresos'
                  : 'Alerta — tu deuda supera el 30% de tus ingresos'}
              </div>
            )}
            {debtRatio <= 30 && monthlyIncome > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                <PiggyBank size={16} />
                Saludable — tu deuda está controlada
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
          <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
            Agregar Deuda
          </h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Monto Total"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Tasa Anual %"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Pago Mínimo"
                value={minimumPayment}
                onChange={(e) => setMinimumPayment(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <input
                type="text"
                placeholder="Acreedor"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} />
              Agregar Deuda
            </button>
          </form>
        </div>

        {debts.length > 0 && (
          <>
            <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
              <div className="flex items-center gap-2 mb-4">
                <PiggyBank size={16} className="text-blue-500" />
                <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
                  Calculadora Bola de Nieve
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                <div className="w-full sm:w-64">
                  <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1">
                    Extra por mes para deudas
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={extraPerMonth}
                    onChange={(e) => setExtraPerMonth(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                  />
                </div>
                {snowballResult ? (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <span className="text-textMuted-light dark:text-textMuted-dark">Tiempo total: </span>
                      <strong className="text-blue-700 dark:text-blue-300">{formatMonths(snowballResult.totalMonths)}</strong>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <span className="text-textMuted-light dark:text-textMuted-dark">Total a pagar: </span>
                      <strong className="text-green-700 dark:text-green-300">{formatCurrency(snowballResult.totalPaid)}</strong>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <span className="text-textMuted-light dark:text-textMuted-dark">En intereses: </span>
                      <strong className="text-purple-700 dark:text-purple-300">
                        {formatCurrency(snowballResult.totalPaid - totalDebt)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-textMuted-light dark:text-textMuted-dark">
                    Ingresa un monto extra mensual para ver la proyección
                  </p>
                )}
              </div>

              {snowballResult && snowballResult.schedule && (
                <details className="group">
                  <summary className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark cursor-pointer hover:text-text-light dark:hover:text-text-dark transition-colors">
                    Ver calendario de pagos mensual ({snowballResult.schedule.length} meses)
                  </summary>
                  <div className="mt-3 max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
                          <th className="text-left py-1.5 pr-2 font-medium">Mes</th>
                          <th className="text-left py-1.5 px-2 font-medium">Deudas activas</th>
                          <th className="text-right py-1.5 pl-2 font-medium">Restante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snowballResult.schedule.map((row) => (
                          <tr key={row.month} className="border-b border-border-light dark:border-border-dark">
                            <td className="py-1.5 pr-2 text-text-light dark:text-text-dark">#{row.month}</td>
                            <td className="py-1.5 px-2 text-textMuted-light dark:text-textMuted-dark">{row.activeCount}</td>
                            <td className="py-1.5 pl-2 text-right font-medium tabular-nums text-text-light dark:text-text-dark">
                              {formatCurrency(row.totalRemaining)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
                Tabla de Amortización
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark text-xs uppercase tracking-wide">
                      <th className="text-left py-2 pr-2 font-medium">Deuda</th>
                      <th className="text-left py-2 px-2 font-medium">Acreedor</th>
                      <th className="text-right py-2 px-2 font-medium">Original</th>
                      <th className="text-right py-2 px-2 font-medium">Tasa</th>
                      <th className="text-right py-2 px-2 font-medium">Mínimo</th>
                      <th className="text-right py-2 px-2 font-medium">Pagado</th>
                      <th className="text-left py-2 px-2 font-medium min-w-[120px]">Progreso</th>
                      <th className="text-right py-2 pl-2 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map((d) => {
                      const remaining = d.totalAmount - (d.paidAmount || 0);
                      const progress = d.totalAmount > 0 ? ((d.paidAmount || 0) / d.totalAmount) * 100 : 0;
                      return (
                        <tr
                          key={d.id}
                          className="border-b border-border-light dark:border-border-dark hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
                        >
                          <td className="py-2.5 pr-2 text-text-light dark:text-text-dark font-medium">
                            {d.name}
                          </td>
                          <td className="py-2.5 px-2 text-textMuted-light dark:text-textMuted-dark">
                            {d.creditor}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-text-light dark:text-text-dark">
                            {formatCurrency(d.totalAmount)}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-textMuted-light dark:text-textMuted-dark">
                            {d.interestRate > 0 ? `${d.interestRate}%` : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-text-light dark:text-text-dark">
                            {formatCurrency(d.minimumPayment)}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={d.totalAmount}
                              value={d.paidAmount || 0}
                              onChange={(e) => handlePaidChange(d.id, e.target.value)}
                              className="w-24 px-2 py-1 text-xs text-right rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors tabular-nums"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    remaining <= 0
                                      ? 'bg-green-500'
                                      : progress > 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-textMuted-light dark:text-textMuted-dark w-10 text-right">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              aria-label="Eliminar deuda"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {debts.length === 0 && (
          <div className="p-12 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <p className="text-textMuted-light dark:text-textMuted-dark">
              No hay deudas registradas. Agrega tu primera deuda arriba.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
