import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, AlertTriangle, PiggyBank, BadgeInfo,
  ChevronDown, ChevronRight, CalendarDays, FileText, Loader2,
  ArrowUpDown, Sparkles, Percent, Calculator, Zap, Snowflake,
} from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { enrichWithUser } from '../services/withUser';
import { sanitizeInput, safeParseFloat } from '../utils/sanitize';
import { useToast } from '../components/Toast';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMonths(m) {
  if (m < 12) return `${m} meses`;
  const years = Math.floor(m / 12);
  const months = m % 12;
  return months > 0
    ? `${years} año${years > 1 ? 's' : ''} ${months} meses`
    : `${years} año${years > 1 ? 's' : ''}`;
}

function runSimulation(debts, extraPerMonth, strategy = 'snowball') {
  if (!debts.length) return null;

  let simulation = debts.map((d) => ({
    id: d.id,
    name: d.name,
    remaining: d.totalAmount - (d.paidAmount || 0),
    minPayment: d.paymentFrequency === 'yearly' ? d.minimumPayment / 12 : d.minimumPayment,
    rate: d.interestRate,
    originalRemaining: d.totalAmount - (d.paidAmount || 0),
  }));

  if (strategy === 'snowball') {
    simulation.sort((a, b) => a.remaining - b.remaining);
  } else {
    simulation.sort((a, b) => (b.rate || 0) - (a.rate || 0));
  }

  let month = 0;
  let totalPaid = 0;
  const schedule = [];
  const maxMonths = 600;

  while (month < maxMonths) {
    simulation.forEach((d) => {
      if (d.remaining > 0) {
        d.remaining *= 1 + d.rate / 100 / 12;
      }
    });

    let available = extraPerMonth;

    simulation.forEach((d) => {
      if (d.remaining > 0) {
        const payment = Math.min(d.minPayment, d.remaining);
        d.remaining -= payment;
        totalPaid += payment;
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
      if (d.remaining > 0 && available > 0) {
        const extra = Math.min(available, d.remaining);
        d.remaining -= extra;
        totalPaid += extra;
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

  return {
    totalMonths: month + 1,
    totalPaid,
    schedule,
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function calculatePayoffMonths(remaining, minPayment, annualRate, extraSim = 0, paymentFrequency = 'monthly') {
  if (remaining <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const effectiveMonthlyPayment = paymentFrequency === 'yearly' ? minPayment / 12 : minPayment;
  let balance = remaining;
  let months = 0;
  const maxMonths = 600;
  while (balance > 0 && months < maxMonths) {
    balance *= 1 + monthlyRate;
    const payment = effectiveMonthlyPayment + extraSim;
    if (payment <= 0) return Infinity;
    balance -= Math.min(payment, balance);
    if (balance < 0.01) balance = 0;
    months++;
  }
  return months;
}

export default function DeudasPage() {
  const [debts, setDebts, isLoadingDebts] = useIndexedDB('debts', []);
  const [monthlyIncome, setMonthlyIncome] = useIndexedDB('monthlyIncome', 0);
  const [extraPerMonth, setExtraPerMonth] = useState(0);

  const [strategy, setStrategy] = useState('snowball');
  const [extraSimMap, setExtraSimMap] = useState({});

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [creditor, setCreditor] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');

  const [expandedDebtId, setExpandedDebtId] = useState(null);
  const [abonosMap, setAbonosMap] = useState({});
  const [loadingAbonos, setLoadingAbonos] = useState({});
  const [abonoFecha, setAbonoFecha] = useState(todayISO);
  const [abonoCantidad, setAbonoCantidad] = useState('');
  const [abonoNota, setAbonoNota] = useState('');
  const [savingAbono, setSavingAbono] = useState(false);

  const { user, session } = useAuth();
  const supabaseReady = isSupabaseConfigured;
  const addToast = useToast();

  useEffect(() => {
    if (!supabaseReady || !user || isLoadingDebts) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .eq('user_id', user.id);
        if (cancelled) return;
        if (error) {
          console.error('[DeudasPage] Error al obtener deudas:', error);
        } else if (data) {
          const mapped = data.map(d => ({
            id: d.id,
            name: d.nombre || d.name,
            totalAmount: d.monto_total || d.amount || d.total_amount,
            interestRate: d.tasa_interes || d.interest_rate || 0,
            minimumPayment: d.minimum_payment,
            creditor: d.acreedor || d.creditor,
            paidAmount: d.amount_paid || d.paidAmount || 0,
            paymentFrequency: d.payment_frequency || 'monthly',
          }));
          setDebts(mapped);
        }
      } catch (err) {
        if (!cancelled) console.error('[DeudasPage] Error inesperado:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setDebts, isLoadingDebts]);

  const totalDebt = useMemo(
    () => debts.reduce((s, d) => s + (d.totalAmount - (d.paidAmount || 0)), 0),
    [debts],
  );

  const totalPaidSoFar = useMemo(
    () => debts.reduce((s, d) => s + (d.paidAmount || 0), 0),
    [debts],
  );

  const totalMinPayments = useMemo(
    () => debts.reduce((s, d) => s + d.minimumPayment, 0),
    [debts],
  );

  const debtRatio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0;

  const simulationResult = useMemo(
    () => runSimulation(debts, extraPerMonth, strategy),
    [debts, extraPerMonth, strategy],
  );

  const avgInterestRate = useMemo(() => {
    const totalRemaining = debts.reduce((s, d) => s + (d.totalAmount - (d.paidAmount || 0)), 0);
    if (totalRemaining <= 0) return 0;
    const weightedSum = debts.reduce((s, d) => {
      const rem = d.totalAmount - (d.paidAmount || 0);
      return s + rem * (d.interestRate || 0);
    }, 0);
    return weightedSum / totalRemaining;
  }, [debts]);

  const sortedDebts = useMemo(() => {
    const list = [...debts];
    if (strategy === 'snowball') {
      list.sort((a, b) => (a.totalAmount - (a.paidAmount || 0)) - (b.totalAmount - (b.paidAmount || 0)));
    } else {
      list.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    }
    return list;
  }, [debts, strategy]);

  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !totalAmount || !minimumPayment) return;

    const localId = crypto.randomUUID();
    const parsedTotal = safeParseFloat(totalAmount);
    const parsedRate = safeParseFloat(interestRate);
    const parsedMin = safeParseFloat(minimumPayment);
    if (parsedTotal <= 0) { addToast('El monto total debe ser mayor a 0', 'warning'); return; }
    if (parsedMin <= 0) { addToast('El pago mínimo debe ser mayor a 0', 'warning'); return; }
    const safeName = sanitizeInput(name).slice(0, 100);
    const safeCreditor = sanitizeInput(creditor).slice(0, 100) || safeName;

    const newDebt = {
      id: localId,
      name: safeName,
      totalAmount: parsedTotal,
      interestRate: parsedRate,
      minimumPayment: parsedMin,
      creditor: safeCreditor,
      paidAmount: 0,
      paymentFrequency,
    };

    setDebts((prev) => [...prev, newDebt]);
    addToast('Deuda agregada correctamente', 'success');

    if (supabaseReady) {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .insert([enrichWithUser({
            nombre: safeName,
            name: safeName,
            monto_total: parsedTotal,
            amount: parsedTotal,
            total_amount: parsedTotal,
            interest_rate: parsedRate,
            tasa_interes: parsedRate,
            minimum_payment: parsedMin,
            creditor: safeCreditor,
            acreedor: safeCreditor,
            payment_frequency: paymentFrequency,
          }, user)])
          .select();

        if (error) {
          setDebts((prev) => prev.filter((d) => d.id !== localId));
          addToast('Error al sincronizar deuda: ' + error.message, 'error');
          return;
        }

        if (data?.[0]?.id) {
          setDebts((prev) =>
            prev.map((d) => (d.id === localId ? { ...d, id: data[0].id } : d)),
          );
        }
      } catch (err) {
        setDebts((prev) => prev.filter((d) => d.id !== localId));
        addToast('Error al sincronizar deuda: ' + err.message, 'error');
      }
    }

    setName('');
    setTotalAmount('');
    setInterestRate('');
    setMinimumPayment('');
    setCreditor('');
    setPaymentFrequency('monthly');
  };

  const handleDelete = async (id) => {
    const snapshot = debts;
    setDebts((prev) => prev.filter((d) => d.id !== id));
    if (expandedDebtId === id) setExpandedDebtId(null);

    if (supabaseReady) {
      try {
        const { error } = await supabase
          .from('deudas')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) {
          setDebts(snapshot);
          console.error('[DeudasPage] Error de Supabase al eliminar deuda:', error);
        }
      } catch (err) {
        setDebts(snapshot);
        console.error('[DeudasPage] Error inesperado al eliminar deuda:', err);
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handlePaidChange = async (id, value) => {
    const amt = parseFloat(value);
    if (isNaN(amt)) return;

    const snapshot = debts;
    let newPaidAmount = 0;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          newPaidAmount = Math.min(Math.max(0, amt), d.totalAmount);
          return { ...d, paidAmount: newPaidAmount };
        }
        return d;
      }),
    );

    if (supabaseReady) {
      try {
        const { error } = await supabase
          .from('deudas')
          .update({ amount_paid: newPaidAmount, paidAmount: newPaidAmount })
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) {
          setDebts(snapshot);
          console.error('[DeudasPage] Error al actualizar paidAmount en Supabase:', error);
        }
      } catch (err) {
        setDebts(snapshot);
        console.error('[DeudasPage] Error inesperado al actualizar paidAmount:', err);
      }
    }
  };

  const fetchAbonos = useCallback(async (debtId) => {
    if (!supabaseReady) return;
    setLoadingAbonos((prev) => ({ ...prev, [debtId]: true }));
    try {
      const { data, error } = await supabase
        .from('deudas_abonos')
        .select('*')
        .eq('user_id', user.id)
        .eq('deuda_id', debtId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[DeudasPage] Error al obtener abonos:', error);
      } else if (data) {
        setAbonosMap((prev) => ({ ...prev, [debtId]: data }));
      }
    } catch (err) {
      console.error('[DeudasPage] Error inesperado al obtener abonos:', err);
    }
    setLoadingAbonos((prev) => ({ ...prev, [debtId]: false }));
  }, [supabaseReady, user]);

  const toggleAccordion = (debtId) => {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
      return;
    }
    setExpandedDebtId(debtId);
    if (!abonosMap[debtId] && supabaseReady) {
      fetchAbonos(debtId);
    }
    setAbonoFecha(todayISO);
    setAbonoCantidad('');
    setAbonoNota('');
  };

  const handleAddAbono = async (debtId) => {
    const cantidadAbonada = safeParseFloat(abonoCantidad);
    if (cantidadAbonada <= 0) { addToast('La cantidad debe ser mayor a 0', 'warning'); return; }
    if (!supabaseReady) return;

    if (!session?.user?.id) { setSavingAbono(false); return; }

    setSavingAbono(true);
    const safeNota = sanitizeInput(abonoNota).slice(0, 200);
    try {
      const { error } = await supabase
        .from('deudas_abonos')
        .insert([enrichWithUser({
          deuda_id: debtId,
          fecha: abonoFecha || todayISO(),
          cantidad_abonada: cantidadAbonada,
          amount_paid: cantidadAbonada,
          amount: cantidadAbonada,
          nota: safeNota,
          note: safeNota,
        }, user)]);

      if (error) {
        addToast('Error al sincronizar abono: ' + error.message, 'error');
        setSavingAbono(false);
        return;
      }

      const { data: abonos, error: fetchError } = await supabase
        .from('deudas_abonos')
        .select('*')
        .eq('user_id', user.id)
        .eq('deuda_id', debtId);

      if (fetchError) {
        addToast('Error al refrescar abonos: ' + fetchError.message, 'error');
        setSavingAbono(false);
        return;
      }

      const totalAbonado = abonos.reduce((sum, a) => sum + (a.cantidad_abonada || 0), 0);
      const debt = debts.find((d) => d.id === debtId);
      const capped = Math.min(totalAbonado, debt?.totalAmount ?? 0);

      setDebts((prev) =>
        prev.map((d) => (d.id === debtId ? { ...d, paidAmount: capped } : d)),
      );

      abonos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || new Date(b.created_at) - new Date(a.created_at));
      setAbonosMap((prev) => ({ ...prev, [debtId]: abonos }));

      setAbonoFecha(todayISO());
      setAbonoCantidad('');
      setAbonoNota('');
    } catch (err) {
      addToast('Error al sincronizar abono: ' + err.message, 'error');
    }
    setSavingAbono(false);
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

        {/* ── Header ── */}
        <Link
          to="/finanzas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Volver a Finanzas
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-light dark:text-text-dark">
            Control de Deudas
          </h1>
        </div>

        {/* ══════════════════════════════════════════════
            FILA SUPERIOR — 3 TARJETAS DE MÉTRICA
           ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          {/* Card 1: Deuda Total Acumulada */}
          <div className="relative p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark">
                  Deuda Total Acumulada
                </span>
                <PiggyBank size={18} className="text-rose-500" />
              </div>
              <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatCurrency(totalDebt)}
              </p>
              <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1.5">
                Pagado: {formatCurrency(totalPaidSoFar)} ·{' '}
                {totalPaidSoFar + totalDebt > 0
                  ? `${((totalPaidSoFar / (totalPaidSoFar + totalDebt)) * 100).toFixed(1)}% cancelado`
                  : 'Sin deudas'}
              </p>
            </div>
          </div>

          {/* Card 2: Tasa de Interés Promedio */}
          <div className="relative p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark">
                  Tasa de Interés Promedio
                </span>
                <Percent size={18} className="text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {avgInterestRate > 0 ? `${avgInterestRate.toFixed(2)}%` : '—'}
              </p>
              <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1.5">
                {debts.filter((d) => d.interestRate > 0).length} de {debts.length} deudas generan interés
              </p>
            </div>
          </div>

          {/* Card 3: Simulador de Fecha de Libertad Financiera */}
          <div className="relative p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark">
                  Libertad Financiera
                </span>
                <Sparkles size={18} className="text-emerald-500" />
              </div>
              {simulationResult ? (
                <>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatMonths(simulationResult.totalMonths)}
                  </p>
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1.5">
                    Aportando {formatCurrency(extraPerMonth || totalMinPayments)}/mes · Pago total: {formatCurrency(simulationResult.totalPaid)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-textMuted-light dark:text-textMuted-dark tabular-nums">
                    {totalMinPayments > 0 ? formatMonths(
                      Math.max(...debts.map((d) => calculatePayoffMonths(
                        d.totalAmount - (d.paidAmount || 0),
                        d.minimumPayment,
                        d.interestRate,
                        0,
                        d.paymentFrequency || 'monthly',
                      )))
                    ) : '—'}
                  </p>
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1.5">
                    Basado en pagos mínimos actuales
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            SALUD FINANCIERA + INGRESOS
           ══════════════════════════════════════════════ */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-8">
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
                onChange={(e) => setMonthlyIncome(safeParseFloat(e.target.value))}
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
                    ? 'text-rose-600 dark:text-rose-400'
                    : debtRatio > 30
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {debtRatio.toFixed(1)}%
              </span>
            </div>
            {debtRatio > 30 ? (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  debtRatio > 50
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                }`}
              >
                <AlertTriangle size={16} />
                {debtRatio > 50
                  ? 'Crítico — tu deuda supera la mitad de tus ingresos'
                  : 'Alerta — tu deuda supera el 30% de tus ingresos'}
              </div>
            ) : monthlyIncome > 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                <PiggyBank size={16} />
                Saludable — tu deuda está controlada
              </div>
            ) : null}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            AGREGAR DEUDA (colapsable)
           ══════════════════════════════════════════════ */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3"
          >
            {showForm ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {showForm ? 'Ocultar formulario' : 'Agregar nueva deuda'}
          </button>

          {showForm && (
            <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
                  <select
                    value={paymentFrequency}
                    onChange={(e) => setPaymentFrequency(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  Agregar Deuda
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════
            STRATEGY SELECTOR + EXTRA PAYMENT
           ══════════════════════════════════════════════ */}
        {debts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="flex items-center gap-3">
              <ArrowUpDown size={16} className="text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark">
                Estrategia
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  onClick={() => setStrategy('snowball')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    strategy === 'snowball'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark'
                  }`}
                >
                  <Snowflake size={13} />
                  Bola de Nieve
                </button>
                <button
                  onClick={() => setStrategy('avalanche')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    strategy === 'avalanche'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark'
                  }`}
                >
                  <Zap size={13} />
                  Avalancha
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-textMuted-light dark:text-textMuted-dark whitespace-nowrap">
                Extra mensual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="$0"
                value={extraPerMonth}
                onChange={(e) => setExtraPerMonth(safeParseFloat(e.target.value))}
                className="w-28 px-2.5 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors tabular-nums"
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            SIMULATION RESULT BANNER
           ══════════════════════════════════════════════ */}
        {simulationResult && debts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Calculator size={15} className="text-blue-600 dark:text-blue-400" />
              <span className="text-textMuted-light dark:text-textMuted-dark">Proyección:</span>
              <strong className="text-text-light dark:text-text-dark">{formatMonths(simulationResult.totalMonths)}</strong>
              <span className="text-textMuted-light dark:text-textMuted-dark">· Pago total:</span>
              <strong className="text-text-light dark:text-text-dark">{formatCurrency(simulationResult.totalPaid)}</strong>
              <span className="text-textMuted-light dark:text-textMuted-dark">· Intereses:</span>
              <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(simulationResult.totalPaid - totalDebt)}</strong>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            PER-DEBT CARDS
           ══════════════════════════════════════════════ */}
        {sortedDebts.length === 0 ? (
          <div className="p-12 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <PiggyBank size={32} className="mx-auto mb-3 text-textMuted-light dark:text-textMuted-dark" />
            <p className="text-textMuted-light dark:text-textMuted-dark">
              No hay deudas registradas. Agrega tu primera deuda arriba.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {sortedDebts.map((d, idx) => {
              const remaining = Math.max(0, d.totalAmount - (d.paidAmount || 0));
              const progress = d.totalAmount > 0 ? ((d.paidAmount || 0) / d.totalAmount) * 100 : 0;
              const freq = d.paymentFrequency || 'monthly';
              const minPayoffMonths = calculatePayoffMonths(remaining, d.minimumPayment, d.interestRate, 0, freq);
              const extraSim = parseFloat(extraSimMap[d.id]) || 0;
              const simPayoffMonths = extraSim > 0 ? calculatePayoffMonths(remaining, d.minimumPayment, d.interestRate, extraSim, freq) : null;
              const monthsSaved = simPayoffMonths !== null ? minPayoffMonths - simPayoffMonths : 0;
              const isExpanded = expandedDebtId === d.id;

              return (
                <div
                  key={d.id}
                  className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md overflow-hidden transition-shadow hover:shadow-sm"
                >
                  {/* Card Header — click to expand */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => toggleAccordion(d.id)}
                  >
                    {/* Top row: rank + name + creditor + amount */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          remaining <= 0
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : strategy === 'snowball'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-light dark:text-text-dark truncate">
                              {d.name}
                            </h3>
                            {remaining <= 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/30">
                                Pagada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-0.5">
                            {d.creditor} · {d.interestRate > 0 ? `${d.interestRate}% anual` : 'Sin interés'} · Pago mín. {formatCurrency(d.minimumPayment)}{freq === 'yearly' ? '/año' : '/mes'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-start gap-1.5">
                        <div>
                          <p className="text-sm font-bold tabular-nums text-text-light dark:text-text-dark">
                            {formatCurrency(remaining)}
                          </p>
                          <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                            de {formatCurrency(d.totalAmount)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(d.id);
                          }}
                          className="p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-40 hover:opacity-100"
                          aria-label="Eliminar deuda"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            remaining <= 0
                              ? 'bg-emerald-500'
                              : progress > 66
                                ? 'bg-blue-500'
                                : progress > 33
                                  ? 'bg-yellow-500'
                                  : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-textMuted-light dark:text-textMuted-dark w-12 text-right">
                        {progress.toFixed(0)}%
                      </span>
                    </div>

                    {/* Payoff info + extra sim */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {minPayoffMonths > 0 && minPayoffMonths < Infinity && remaining > 0 ? (
                        <p className="text-xs text-textMuted-light dark:text-textMuted-dark">
                          A este ritmo, liquidarás en{' '}
                          <strong className="text-text-light dark:text-text-dark">
                            {formatMonths(minPayoffMonths)}
                          </strong>
                        </p>
                      ) : remaining <= 0 ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ¡Deuda liquidada!
                        </p>
                      ) : (
                        <p className="text-xs text-rose-600 dark:text-rose-400">
                          El pago mínimo no cubre los intereses
                        </p>
                      )}

                      {/* Extra payment simulator */}
                      {remaining > 0 && (
                        <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] text-textMuted-light dark:text-textMuted-dark whitespace-nowrap">
                            +$ extra/mes
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            value={extraSimMap[d.id] || ''}
                            onChange={(e) => setExtraSimMap((prev) => ({ ...prev, [d.id]: e.target.value }))}
                            className="w-20 px-2 py-1 text-xs rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors tabular-nums"
                          />
                          {simPayoffMonths !== null && (
                            <span className={`text-[10px] font-medium whitespace-nowrap ${
                              monthsSaved > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-textMuted-light dark:text-textMuted-dark'
                            }`}>
                              {monthsSaved > 0
                                ? `→ ${formatMonths(simPayoffMonths)} (${monthsSaved} menos 🎯)`
                                : `→ ${formatMonths(simPayoffMonths)}`
                              }
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expand indicator */}
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark flex items-center gap-1">
                        {isExpanded ? 'Ocultar abonos' : 'Ver abonos'}
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                    </div>
                  </div>

                  {/* ── Expanded Abonos Section ── */}
                  {isExpanded && (
                    <div className="border-t border-border-light dark:border-border-dark px-5 py-4 bg-bg-light/30 dark:bg-bg-dark/30">
                      {!supabaseReady ? (
                        <div className="text-sm text-textMuted-light dark:text-textMuted-dark text-center py-4">
                          Configura <code className="px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-xs font-mono">VITE_SUPABASE_URL</code> y{' '}
                          <code className="px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-xs font-mono">VITE_SUPABASE_ANON_KEY</code> en tu archivo <code className="px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-xs font-mono">.env</code> para activar el historial de abonos.
                        </div>
                      ) : loadingAbonos[d.id] ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-textMuted-light dark:text-textMuted-dark">
                          <Loader2 size={16} className="animate-spin" />
                          Cargando abonos…
                        </div>
                      ) : (
                        <>
                          {/* Add abono form */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                            <div>
                              <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1 flex items-center gap-1">
                                <CalendarDays size={12} />
                                Fecha
                              </label>
                              <input
                                type="date"
                                value={abonoFecha}
                                onChange={(e) => setAbonoFecha(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1 flex items-center gap-1">
                                <Plus size={12} />
                                Cantidad
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={abonoCantidad}
                                onChange={(e) => setAbonoCantidad(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1 flex items-center gap-1">
                                <FileText size={12} />
                                Nota
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Ej. Abono con dinero extra"
                                  value={abonoNota}
                                  onChange={(e) => setAbonoNota(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                                />
                                <button
                                  onClick={() => handleAddAbono(d.id)}
                                  disabled={savingAbono || !abonoCantidad || parseFloat(abonoCantidad) <= 0}
                                  className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1"
                                >
                                  {savingAbono ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                  Guardar
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Abonos list */}
                          {(abonosMap[d.id] || []).length === 0 ? (
                            <p className="text-sm text-textMuted-light dark:text-textMuted-dark text-center py-3">
                              No hay abonos registrados para esta deuda.
                            </p>
                          ) : (
                            <div className="max-h-60 overflow-y-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
                                    <th className="text-left py-1.5 pr-2 font-medium">Fecha</th>
                                    <th className="text-right py-1.5 px-2 font-medium">Cantidad</th>
                                    <th className="text-left py-1.5 pl-2 font-medium">Nota</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(abonosMap[d.id] || []).map((a) => (
                                    <tr key={a.id} className="border-b border-border-light dark:border-border-dark">
                                      <td className="py-1.5 pr-2 text-text-light dark:text-text-dark">
                                        {formatDate(a.fecha)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(a.cantidad_abonada)}
                                      </td>
                                      <td className="py-1.5 pl-2 text-textMuted-light dark:text-textMuted-dark">
                                        {a.nota || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            SNOWBALL CALENDAR (colapsable)
           ══════════════════════════════════════════════ */}
        {simulationResult && simulationResult.schedule && simulationResult.schedule.length > 0 && (
          <details className="group mb-8">
            <summary className="flex items-center gap-2 text-sm font-medium text-textMuted-light dark:text-textMuted-dark cursor-pointer hover:text-text-light dark:hover:text-text-dark transition-colors p-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
              <Calculator size={15} className="text-blue-500" />
              Ver calendario de pagos mensual ({simulationResult.schedule.length} meses)
              <ChevronRight size={14} className="ml-auto group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-border-light dark:border-border-dark">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide bg-bg-light/50 dark:bg-bg-dark/50 sticky top-0">
                    <th className="text-left py-2 pr-2 pl-3 font-medium">Mes</th>
                    <th className="text-left py-2 px-2 font-medium">Deudas activas</th>
                    <th className="text-right py-2 pl-2 pr-3 font-medium">Restante</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.schedule.map((row) => (
                    <tr key={row.month} className="border-b border-border-light dark:border-border-dark hover:bg-bg-light/50 dark:hover:bg-bg-dark/50 transition-colors">
                      <td className="py-2 pr-2 pl-3 text-text-light dark:text-text-dark font-medium">#{row.month}</td>
                      <td className="py-2 px-2 text-textMuted-light dark:text-textMuted-dark">{row.activeCount}</td>
                      <td className="py-2 pl-2 pr-3 text-right font-medium tabular-nums text-text-light dark:text-text-dark">
                        {formatCurrency(row.totalRemaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* Delete button per debt (floating at bottom for convenience) */}
        {sortedDebts.length > 0 && (
          <div className="flex justify-end">
            <div className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
              {debts.length} deuda{debts.length !== 1 ? 's' : ''} registrada{debts.length !== 1 ? 's' : ''} · Estrategia: {strategy === 'snowball' ? 'Bola de Nieve' : 'Avalancha'}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
