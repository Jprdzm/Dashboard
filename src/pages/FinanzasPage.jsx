import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Filter, Loader2,
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  ArrowUpRight, ArrowDownLeft, CheckCircle2, CalendarDays, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { enrichWithUser } from '../services/withUser';
import { useIndexedDB } from '../hooks/useIndexedDB';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

const CATEGORIAS = [
  'Estudios', 'Gimnasio', 'Comida', 'Transporte',
  'Entretenimiento', 'Vivienda', 'Salud', 'Otros',
];

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(LOCALE, {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-');
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString(LOCALE, { month: 'short', year: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  return (
    <div className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-xs shadow-sm">
      <p className="font-medium text-text-light dark:text-text-dark mb-1">{label}</p>
      <p className={val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
        {val >= 0 ? '+' : ''}{formatCurrency(val)}
      </p>
    </div>
  );
}

export default function FinanzasPage() {
  const { user } = useAuth();
  const supabaseReady = isSupabaseConfigured;

  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(() => isSupabaseConfigured);
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('gasto');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Otros');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [orden, setOrden] = useState('newest');
  const [mesSeleccionado, setMesSeleccionado] = useState(null);
  const [refrescar, setRefrescar] = useState(0);

  const [limiteSemanal] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [debts, setDebts] = useIndexedDB('debts', []);
  const [recentAbonos, setRecentAbonos] = useState([]);
  const [loadingAbonos, setLoadingAbonos] = useState(false);

  const deudasActivas = useMemo(
    () => debts
      .filter((d) => (d.totalAmount - (d.paidAmount || 0)) > 0)
      .sort((a, b) => (a.minimumPayment || 0) - (b.minimumPayment || 0))
      .slice(0, 4),
    [debts],
  );

  const totalDeudaActiva = useMemo(
    () => debts.reduce((s, d) => s + (d.totalAmount - (d.paidAmount || 0)), 0),
    [debts],
  );

  const abonosConNombre = useMemo(() => {
    return recentAbonos.map((a) => ({
      ...a,
      debtName: debts.find((d) => d.id === a.deuda_id)?.name
        || debts.find((d) => d.id === a.deuda_id)?.creditor
        || 'Deuda eliminada',
    }));
  }, [recentAbonos, debts]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('deudas')
          .select('*')
          .eq('user_id', user.id);
        if (cancelled) return;
        if (error) {
          console.error('[FinanzasPage] Error al obtener deudas:', error);
        } else if (data && data.length > 0) {
          const mapped = data.map((d) => ({
            id: d.id,
            name: d.nombre || d.name,
            totalAmount: d.monto_total || d.amount || d.total_amount,
            interestRate: d.tasa_interes || d.interest_rate || 0,
            minimumPayment: d.minimum_payment,
            creditor: d.acreedor || d.creditor,
            paidAmount: d.amount_paid || d.paidAmount || 0,
          }));
          if (!cancelled) setDebts(mapped);
        }
      } catch (err) {
        if (!cancelled) console.error('[FinanzasPage] Error inesperado al obtener deudas:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setDebts]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    setLoadingAbonos(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('deudas_abonos')
          .select('*')
          .eq('user_id', user.id)
          .order('fecha', { ascending: false })
          .limit(6);
        if (!cancelled && !error && data) {
          setRecentAbonos(data);
        }
      } catch (err) {
        if (!cancelled) console.error('[FinanzasPage] Error al obtener abonos:', err);
      }
      if (!cancelled) setLoadingAbonos(false);
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, refrescar]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('finanzas')
          .select('*')
          .eq('user_id', user.id)
          .order('fecha', { ascending: false });
        if (cancelled) return;
        if (error) {
          console.error('[FinanzasPage] Error al obtener transacciones:', error);
        } else if (data) {
          setTransacciones(data);
        }
      } catch (err) {
        if (!cancelled) console.error('[FinanzasPage] Error inesperado al obtener transacciones:', err);
      }
      if (!cancelled) setCargando(false);
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, refrescar]);

  const balance = useMemo(
    () => transacciones.reduce((acc, t) => (t.tipo === 'ingreso' ? acc + t.monto : acc - t.monto), 0),
    [transacciones],
  );

  const datosBarraMensual = useMemo(() => {
    const groups = {};
    transacciones.forEach((t) => {
      const key = getMonthKey(t.fecha);
      if (!groups[key]) groups[key] = { ingreso: 0, gasto: 0 };
      if (t.tipo === 'ingreso') groups[key].ingreso += t.monto;
      else groups[key].gasto += t.monto;
    });
    return Object.entries(groups)
      .map(([month, data]) => ({
        month,
        netBalance: data.ingreso - data.gasto,
        ingreso: data.ingreso,
        gasto: data.gasto,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [transacciones]);

  const transaccionesMesSeleccionado = useMemo(() => {
    if (!mesSeleccionado) return [];
    return transacciones
      .filter((t) => getMonthKey(t.fecha) === mesSeleccionado)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [transacciones, mesSeleccionado]);

  const recientesFiltradas = useMemo(() => {
    let list = transacciones.filter((t) => new Date(t.fecha).getTime() >= limiteSemanal);
    if (filtroCategoria !== 'Todos') {
      list = list.filter((t) => (t.categoria || 'Otros') === filtroCategoria);
    }
    list.sort((a, b) =>
      orden === 'newest'
        ? new Date(b.fecha) - new Date(a.fecha)
        : new Date(a.fecha) - new Date(b.fecha),
    );
    return list;
  }, [transacciones, filtroCategoria, orden, limiteSemanal]);

  const totalesPorCategoria = useMemo(() => {
    const totals = {};
    transacciones
      .filter((t) => t.tipo === 'gasto')
      .forEach((t) => {
        const cat = t.categoria || 'Otros';
        totals[cat] = (totals[cat] || 0) + t.monto;
      });
    const max = Math.max(...Object.values(totals), 1);
    return { totals, max };
  }, [transacciones]);

  const totalIngresos = useMemo(
    () => transacciones.reduce((acc, t) => (t.tipo === 'ingreso' ? acc + t.monto : acc), 0),
    [transacciones],
  );
  const totalGastos = useMemo(
    () => transacciones.reduce((acc, t) => (t.tipo === 'gasto' ? acc + t.monto : acc), 0),
    [transacciones],
  );

  const mesActualKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const ingresosMes = useMemo(
    () => transacciones
      .filter((t) => t.tipo === 'ingreso' && getMonthKey(t.fecha) === mesActualKey)
      .reduce((acc, t) => acc + t.monto, 0),
    [transacciones, mesActualKey],
  );

  const gastosMes = useMemo(
    () => transacciones
      .filter((t) => t.tipo === 'gasto' && getMonthKey(t.fecha) === mesActualKey)
      .reduce((acc, t) => acc + t.monto, 0),
    [transacciones, mesActualKey],
  );

  const ahorroTotal = balance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !descripcion) return;
    if (!supabaseReady) return;

    try {
      const { error } = await supabase
        .from('finanzas')
        .insert([enrichWithUser({
          monto: parseFloat(monto),
          amount: parseFloat(monto),
          tipo,
          descripcion,
          categoria,
          fecha: new Date().toISOString(),
        }, user)]);

      if (error) {
        alert('Error crítico de Supabase: ' + error.message);
        return;
      }

      setMonto('');
      setDescripcion('');
      setCategoria('Otros');
      setRefrescar((c) => c + 1);
    } catch (err) {
      alert('Error crítico de Supabase: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!supabaseReady) return;

    try {
      const { error } = await supabase
        .from('finanzas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        alert('Error crítico de Supabase: ' + error.message);
        return;
      }

      setRefrescar((c) => c + 1);
    } catch (err) {
      alert('Error crítico de Supabase: ' + err.message);
    }
  };

  const handleBarClick = (entry) => {
    if (entry?.month) {
      setMesSeleccionado((prev) => (prev === entry.month ? null : entry.month));
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-textMuted-light dark:text-textMuted-dark" />
      </div>
    );
  }

  if (!supabaseReady) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
          <p className="text-sm text-textMuted-light dark:text-textMuted-dark mb-2">
            Configura <code className="px-1.5 py-0.5 rounded bg-bg-light dark:bg-bg-dark text-xs font-mono">VITE_SUPABASE_URL</code> y{' '}
            <code className="px-1.5 py-0.5 rounded bg-bg-light dark:bg-bg-dark text-xs font-mono">VITE_SUPABASE_ANON_KEY</code> en tu <code className="px-1.5 py-0.5 rounded bg-bg-light dark:bg-bg-dark text-xs font-mono">.env</code> para usar Finanzas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* ── Header ── */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-light dark:text-text-dark">
            Finanzas
          </h1>
          <div className="flex items-center gap-3">
            <Link
              to="/deudas"
              className="text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
            >
              Deudas
            </Link>
            <Link
              to="/metas"
              className="text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
            >
              Metas
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            FILA SUPERIOR — 4 TARJETAS DE RESUMEN
           ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Card 1: Balance Total */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="mb-3">
              <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Balance Total
            </span>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(balance)}
            </p>
          </div>

          {/* Card 2: Ingresos del Mes */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="mb-3">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Ingresos del Mes
            </span>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {formatCurrency(ingresosMes)}
            </p>
          </div>

          {/* Card 3: Gastos del Mes */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="mb-3">
              <TrendingDown size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Gastos del Mes
            </span>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {formatCurrency(gastosMes)}
            </p>
          </div>

          {/* Card 4: Metas de Ahorro */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="mb-3">
              <PiggyBank size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Ahorro Total
            </span>
            <p className={`text-2xl font-bold mt-1 ${ahorroTotal >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(ahorroTotal)}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            GRILLA PRINCIPAL — 2 COLUMNAS
           ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">

          {/* ─────── Columna Izquierda (3/4) ─────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Gráfico de Balance */}
            {datosBarraMensual.length > 0 && (
              <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
                <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
                  Balance Neto por Mes
                  <span className="ml-2 text-xs font-normal text-textMuted-light dark:text-textMuted-dark">
                    — haz clic en una barra para ver su desglose
                  </span>
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={datosBarraMensual} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonthLabel}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCurrency(v)}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar
                      dataKey="netBalance"
                      radius={[4, 4, 0, 0]}
                      onClick={handleBarClick}
                      cursor="pointer"
                      className="focus:outline-none"
                    >
                      {datosBarraMensual.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            mesSeleccionado === entry.month
                              ? entry.netBalance >= 0 ? '#059669' : '#e11d48'
                              : entry.netBalance >= 0 ? '#6ee7b7' : '#fda4af'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Historial de Transacciones — diseño premium */}
            <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
                    Historial de Transacciones
                  </h2>
                  <span className="text-xs text-textMuted-light dark:text-textMuted-dark">
                    ({recientesFiltradas.length} movimientos)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-textMuted-light dark:text-textMuted-dark" />
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                  >
                    <option value="Todos">Todas las categorías</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    className="px-2 py-1 text-xs rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
                  >
                    <option value="newest">Más reciente</option>
                    <option value="oldest">Más antiguo</option>
                  </select>
                </div>
              </div>

              {recientesFiltradas.length === 0 ? (
                <p className="text-sm text-textMuted-light dark:text-textMuted-dark text-center py-8">
                  No hay movimientos en los últimos 7 días
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05] text-xs text-textMuted-light dark:text-textMuted-dark uppercase tracking-wider">
                        <th className="text-left py-3 pr-3 font-medium w-10"></th>
                        <th className="text-left py-3 pr-3 font-medium">Transacción</th>
                        <th className="text-left py-3 pr-3 font-medium hidden sm:table-cell">Categoría</th>
                        <th className="text-left py-3 pr-3 font-medium hidden sm:table-cell">Fecha</th>
                        <th className="text-right py-3 pl-3 font-medium">Monto</th>
                        <th className="text-right py-3 pl-3 font-medium w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recientesFiltradas.map((t) => {
                        const isIngreso = t.tipo === 'ingreso';
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-slate-100 dark:border-white/[0.05] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                          >
                            {/* Avatar circular */}
                            <td className="py-3 pr-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isIngreso
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                  : 'bg-rose-100 dark:bg-rose-900/30'
                              }`}>
                                {isIngreso
                                  ? <ArrowDownLeft size={14} className="text-emerald-600 dark:text-emerald-400" />
                                  : <ArrowUpRight size={14} className="text-rose-600 dark:text-rose-400" />
                                }
                              </div>
                            </td>

                            {/* Descripción + fecha (móvil) */}
                            <td className="py-3 pr-3">
                              <p className="text-sm font-medium text-text-light dark:text-text-dark leading-tight">
                                {t.descripcion}
                              </p>
                              <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark mt-0.5 sm:hidden">
                                {t.categoria || 'Otros'} · {formatDate(t.fecha)}
                              </p>
                            </td>

                            {/* Categoría (desktop) */}
                            <td className="py-3 pr-3 hidden sm:table-cell">
                              <span className="text-xs text-textMuted-light dark:text-textMuted-dark">
                                {t.categoria || 'Otros'}
                              </span>
                            </td>

                            {/* Fecha (desktop) */}
                            <td className="py-3 pr-3 hidden sm:table-cell">
                              <span className="text-xs text-textMuted-light dark:text-textMuted-dark tabular-nums">
                                {formatDate(t.fecha)}
                              </span>
                            </td>

                            {/* Monto */}
                            <td className={`py-3 pl-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap ${
                              isIngreso
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {isIngreso ? '+' : '-'}{formatCurrency(t.monto)}
                            </td>

                            {/* Tag + delete */}
                            <td className="py-3 pl-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/30">
                                  <CheckCircle2 size={10} />
                                  Completado
                                </span>
                                <button
                                  onClick={() => handleDelete(t.id)}
                                  className="p-1 rounded-md text-textMuted-light dark:text-textMuted-dark opacity-0 group-hover:opacity-100 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                  aria-label="Eliminar"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ─────── Columna Derecha (1/4) ─────── */}
          <div className="lg:col-span-1">

            {/* Schedule Payments — vinculado a deudas activas */}
            <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text-light dark:text-text-dark text-sm flex items-center gap-2">
                  <CalendarDays size={14} className="text-blue-600 dark:text-blue-400" />
                  Schedule Payments
                </h2>
                {totalDeudaActiva > 0 && (
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatCurrency(totalDeudaActiva)}
                  </span>
                )}
              </div>

              {deudasActivas.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark">
                    Sin deudas activas
                  </p>
                  <Link
                    to="/deudas"
                    className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Registrar deuda →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {deudasActivas.map((d, idx) => {
                    const remaining = d.totalAmount - (d.paidAmount || 0);
                    const paid = d.paidAmount || 0;
                    const progress = d.totalAmount > 0 ? (paid / d.totalAmount) * 100 : 0;
                    const isUrgent = idx === 0;
                    return (
                      <Link
                        key={d.id}
                        to="/deudas"
                        className="block p-2.5 rounded-lg bg-bg-light dark:bg-bg-dark hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isUrgent
                                ? 'bg-rose-100 dark:bg-rose-900/30'
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {isUrgent
                                ? <AlertTriangle size={11} className="text-rose-600 dark:text-rose-400" />
                                : <CalendarDays size={11} className="text-blue-600 dark:text-blue-400" />
                              }
                            </div>
                            <p className="text-xs font-medium text-text-light dark:text-text-dark truncate leading-tight">
                              {d.name || d.creditor}
                            </p>
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-text-light dark:text-text-dark ml-2 shrink-0">
                            {formatCurrency(remaining)}
                          </span>
                        </div>

                        {/* Mini barra de progreso */}
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                            Pago mín. {formatCurrency(d.minimumPayment || 0)}
                          </span>
                          <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                            {Math.round(progress)}% pagado
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                  {deudasActivas.filter(d => (d.paidAmount || 0) >= d.totalAmount).length}/{deudasActivas.length} pagadas
                </span>
                <Link
                  to="/deudas"
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Gestionar →
                </Link>
              </div>
            </div>

            {/* ─────── Pagos Recientes ─────── */}
            <div className="mt-4 p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text-light dark:text-text-dark text-sm flex items-center gap-2">
                  <TrendingDown size={14} className="text-emerald-600 dark:text-emerald-400" />
                  Pagos Recientes
                </h2>
                <Link
                  to="/deudas"
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Ver todo →
                </Link>
              </div>

              {loadingAbonos ? (
                <div className="py-4 text-center">
                  <Loader2 size={16} className="animate-spin text-textMuted-light dark:text-textMuted-dark mx-auto" />
                </div>
              ) : abonosConNombre.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark">
                    Sin pagos registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {abonosConNombre.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-bg-light dark:bg-bg-dark"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <TrendingDown size={11} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-light dark:text-text-dark truncate leading-tight">
                            {a.debtName}
                          </p>
                          <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                            {new Date(a.fecha).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })}
                            {a.nota ? ` · ${a.nota}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 ml-2 shrink-0">
                        -{formatCurrency(a.cantidad_abonada || a.amount_paid || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            DESGLOSE DEL MES
            ══════════════════════════════════════════════ */}
        {mesSeleccionado && transaccionesMesSeleccionado.length > 0 && (
          <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
                Desglose — {formatMonthLabel(mesSeleccionado)}
              </h2>
              <button
                onClick={() => setMesSeleccionado(null)}
                className="text-xs text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
              >
                Cerrar
              </button>
            </div>
            {(() => {
              const subIngreso = transaccionesMesSeleccionado
                .filter((t) => t.tipo === 'ingreso')
                .reduce((s, t) => s + t.monto, 0);
              const subGasto = transaccionesMesSeleccionado
                .filter((t) => t.tipo === 'gasto')
                .reduce((s, t) => s + t.monto, 0);
              return (
                <>
                  <div className="flex gap-4 mb-3 text-xs text-textMuted-light dark:text-textMuted-dark">
                    <span>Ingresos: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(subIngreso)}</strong></span>
                    <span>Gastos: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(subGasto)}</strong></span>
                    <span>Neto: <strong className={subIngreso - subGasto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{formatCurrency(subIngreso - subGasto)}</strong></span>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark text-xs uppercase tracking-wide">
                          <th className="text-left py-1.5 pr-2 font-medium">Fecha</th>
                          <th className="text-left py-1.5 px-2 font-medium">Descripción</th>
                          <th className="text-left py-1.5 px-2 font-medium hidden sm:table-cell">Categoría</th>
                          <th className="text-right py-1.5 pl-2 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaccionesMesSeleccionado.map((t) => (
                          <tr key={t.id} className="border-b border-border-light dark:border-border-dark">
                            <td className="py-1.5 pr-2 text-textMuted-light dark:text-textMuted-dark whitespace-nowrap text-xs">{formatDate(t.fecha)}</td>
                            <td className="py-1.5 px-2 text-text-light dark:text-text-dark text-xs">{t.descripcion}</td>
                            <td className="py-1.5 px-2 text-textMuted-light dark:text-textMuted-dark hidden sm:table-cell text-xs">{t.categoria || 'Otros'}</td>
                            <td className={`py-1.5 pl-2 text-right font-medium tabular-nums whitespace-nowrap text-xs ${t.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            GASTOS POR CATEGORÍA
           ══════════════════════════════════════════════ */}
        {Object.keys(totalesPorCategoria.totals).length > 0 && (
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-8">
            <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
              Gastos por Categoría
            </h2>
            <div className="space-y-2">
              {CATEGORIAS.filter((c) => (totalesPorCategoria.totals[c] || 0) > 0).map((cat) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs text-textMuted-light dark:text-textMuted-dark mb-1">
                    <span>{cat}</span>
                    <span>{formatCurrency(totalesPorCategoria.totals[cat])}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(totalesPorCategoria.totals[cat] / totalesPorCategoria.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            NUEVO MOVIMIENTO (formulario)
           ══════════════════════════════════════════════ */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-8">
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
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mensualidad del gym"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
