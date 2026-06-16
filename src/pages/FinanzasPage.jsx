import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Filter, Loader2, Search, Download,
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  ArrowUpRight, ArrowDownLeft, CalendarDays, AlertTriangle, PlaySquare,
  Edit3, Check, X, Target, DollarSign,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { enrichWithUser } from '../services/withUser';
import { useIndexedDB } from '../hooks/useIndexedDB';
import db from '../services/db';
import { sanitizeInput, safeParseFloat, validateEnum, sanitizeCSVField, ALLOWED_CATEGORIES, ALLOWED_TIPOS } from '../utils/sanitize';
import { useToast } from '../components/Toast';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';
const CATEGORIAS = ALLOWED_CATEGORIES;

const DEFAULT_BUDGET = Object.fromEntries(ALLOWED_CATEGORIES.map(c => [c, 0]));

const CAT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#a855f7',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#94a3b8',
];

function fmt(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(value);
}
function fmtFull(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(LOCALE, { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function fmtMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString(LOCALE, { month: 'short', year: '2-digit' });
}

/* ── Custom Tooltip para AreaChart ── */
function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] shadow-lg text-xs">
      <p className="font-semibold text-text-light dark:text-text-dark mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.dataKey === 'ingreso' ? '↑ Ingresos' : '↓ Gastos'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ── Custom Tooltip para PieChart ── */
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] shadow-lg text-xs">
      <p className="font-semibold" style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
      <p className="text-text-light dark:text-text-dark font-medium">{fmtFull(payload[0].value)}</p>
      <p className="text-textMuted-light dark:text-textMuted-dark">{payload[0].payload.pct?.toFixed(1)}%</p>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ icon: Icon, iconColor, iconBg, label, value, pct, pctPositiveIsGood = true }) {
  const isPos = pct >= 0;
  const isGood = pctPositiveIsGood ? isPos : !isPos;
  return (
    <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor} />
        </div>
        {pct !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isGood
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
          }`}>
            {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-text-light dark:text-text-dark tabular-nums leading-tight">{value}</p>
    </div>
  );
}

/* ── Donut Chart Card ── */
function DonutCard({ title, data, centerLabel, centerValue, centerColor = 'text-text-light dark:text-text-dark' }) {
  return (
    <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
      <h3 className="font-semibold text-text-light dark:text-text-dark text-sm mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-xs text-textMuted-light dark:text-textMuted-dark text-center py-6">Sin datos</p>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{centerLabel}</p>
              <p className={`text-sm font-bold tabular-nums ${centerColor}`}>{centerValue}</p>
            </div>
          </div>
          {/* Legend */}
          <div className="space-y-1.5 mt-2">
            {data.slice(0, 5).map((entry, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs text-textMuted-light dark:text-textMuted-dark truncate">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-text-light dark:text-text-dark shrink-0">{fmt(entry.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Health grade helper ── */
function getHealthGrade(score) {
  if (score === null) return { grade: '—', label: 'Sin datos', color: 'text-textMuted-light dark:text-textMuted-dark', bg: 'bg-slate-100 dark:bg-white/5' };
  if (score >= 90) return { grade: 'A', label: 'Excelente', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/25' };
  if (score >= 75) return { grade: 'B', label: 'Bueno', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/25' };
  if (score >= 60) return { grade: 'C', label: 'Regular', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/25' };
  if (score >= 40) return { grade: 'D', label: 'Cuidado', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/25' };
  return { grade: 'F', label: 'Crítico', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/25' };
}

/* ── Budget Bar Tooltip ── */
function BudgetBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const presupuesto = payload.find(p => p.dataKey === 'Presupuesto')?.value ?? 0;
  const gastado = payload.find(p => p.dataKey === 'Gastado')?.value ?? 0;
  const fullName = payload[0]?.payload?.fullName || label;
  return (
    <div className="px-3 py-2 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] shadow-lg text-xs">
      <p className="font-semibold text-text-light dark:text-text-dark mb-1.5">{fullName}</p>
      {presupuesto > 0 && <p className="text-indigo-500 font-medium">Presupuesto: {fmtFull(presupuesto)}</p>}
      {gastado > 0 && <p className="text-rose-500 font-medium">Gastado: {fmtFull(gastado)}</p>}
      {presupuesto > 0 && (
        <p className={`mt-1 font-semibold ${gastado > presupuesto ? 'text-rose-500' : 'text-emerald-500'}`}>
          {gastado > presupuesto
            ? `Excedido: ${fmtFull(gastado - presupuesto)}`
            : `Disponible: ${fmtFull(presupuesto - gastado)}`}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function FinanzasPage() {
  const { user } = useAuth();
  const supabaseReady = isSupabaseConfigured;
  const addToast = useToast();

  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(() => isSupabaseConfigured);
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('gasto');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Otros');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [orden, setOrden] = useState('newest');
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [refrescar, setRefrescar] = useState(0);

  const [debts, setDebts] = useIndexedDB('debts', []);
  const [recentAbonos, setRecentAbonos] = useState([]);
  const [loadingAbonos, setLoadingAbonos] = useState(false);
  const [goals, setGoals] = useIndexedDB('goals', []);
  const [subs, setSubs] = useIndexedDB('suscripciones', []);

  const [budgetCats, setBudgetCats] = useIndexedDB('budget_categorias', DEFAULT_BUDGET);
  const [ingresoObjetivo, setIngresoObjetivo] = useIndexedDB('budget_ingreso_obj', 0);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState({});
  const [ingresoObjDraft, setIngresoObjDraft] = useState('');

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('presupuesto')
          .select('categorias')
          .eq('user_id', user.id)
          .single();
        if (!cancelled && !error && data?.categorias) setBudgetCats(data.categorias);
      } catch { /* usa IndexedDB como fallback */ }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user]);

  /* ── data fetching (unchanged) ── */
  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('deudas').select('*').eq('user_id', user.id);
        if (cancelled || error || !data?.length) return;
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
      } catch { /* ignored */ }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setDebts]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from('metas').select('*').eq('user_id', user.id);
        if (!cancelled && data) setGoals(data.map((d) => ({ id: d.id, currentAmount: d.monto_actual || d.current_amount || 0 })));
      } catch { /* ignored */ }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setGoals]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from('suscripciones').select('*').eq('user_id', user.id);
        if (!cancelled && data) setSubs(data.map((d) => ({ id: d.id, name: d.nombre, cost: d.costo, renewalDate: d.fecha_renovacion, bank: d.banco_pago })));
      } catch { /* ignored */ }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setSubs]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    setLoadingAbonos(true);
    (async () => {
      try {
        const { data, error } = await supabase.from('deudas_abonos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }).limit(6);
        if (!cancelled && !error && data) setRecentAbonos(data);
      } catch { /* ignored */ }
      if (!cancelled) setLoadingAbonos(false);
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, refrescar]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('finanzas').select('*').eq('user_id', user.id).order('fecha', { ascending: false });
        if (cancelled) return;
        if (error) {
          const cached = await db.getItem('finanzas_cache');
          if (cached) setTransacciones(cached);
        } else if (data) {
          await db.setItem('finanzas_cache', data);
          setTransacciones(data);
        }
      } catch {
        if (!cancelled) {
          const cached = await db.getItem('finanzas_cache');
          if (cached) setTransacciones(cached);
        }
      }
      if (!cancelled) setCargando(false);
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, refrescar]);

  /* ── derived data ── */
  const mesActualKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const prevMesKey = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const balance = useMemo(
    () => transacciones.reduce((acc, t) => (t.tipo === 'ingreso' ? acc + t.monto : acc - t.monto), 0),
    [transacciones],
  );

  const ingresosMes = useMemo(
    () => transacciones.filter((t) => t.tipo === 'ingreso' && getMonthKey(t.fecha) === mesActualKey).reduce((a, t) => a + t.monto, 0),
    [transacciones, mesActualKey],
  );
  const gastosMes = useMemo(
    () => transacciones.filter((t) => t.tipo === 'gasto' && getMonthKey(t.fecha) === mesActualKey).reduce((a, t) => a + t.monto, 0),
    [transacciones, mesActualKey],
  );
  const ingresosPrevMes = useMemo(
    () => transacciones.filter((t) => t.tipo === 'ingreso' && getMonthKey(t.fecha) === prevMesKey).reduce((a, t) => a + t.monto, 0),
    [transacciones, prevMesKey],
  );
  const gastosPrevMes = useMemo(
    () => transacciones.filter((t) => t.tipo === 'gasto' && getMonthKey(t.fecha) === prevMesKey).reduce((a, t) => a + t.monto, 0),
    [transacciones, prevMesKey],
  );

  const pctIngresos = ingresosPrevMes > 0 ? ((ingresosMes - ingresosPrevMes) / ingresosPrevMes) * 100 : 0;
  const pctGastos = gastosPrevMes > 0 ? ((gastosMes - gastosPrevMes) / gastosPrevMes) * 100 : 0;

  const ahorroTotal = useMemo(() => goals.reduce((s, g) => s + (g.currentAmount || 0), 0), [goals]);

  /* ── budget derived ── */
  const gastosMesPorCat = useMemo(() => {
    const totals = {};
    transacciones
      .filter(t => t.tipo === 'gasto' && getMonthKey(t.fecha) === mesActualKey)
      .forEach(t => { const cat = t.categoria || 'Otros'; totals[cat] = (totals[cat] || 0) + t.monto; });
    return totals;
  }, [transacciones, mesActualKey]);

  const gastosMesPorCatPrevMes = useMemo(() => {
    const totals = {};
    transacciones.filter(t => t.tipo === 'gasto' && getMonthKey(t.fecha) === prevMesKey)
      .forEach(t => { const cat = t.categoria || 'Otros'; totals[cat] = (totals[cat] || 0) + t.monto; });
    return totals;
  }, [transacciones, prevMesKey]);

  const gastosFijosPresupuesto = useMemo(() => {
    const items = [];
    subs.forEach(s => { if ((s.cost || 0) > 0) items.push({ id: `s-${s.id}`, name: s.name, amount: s.cost, tipo: 'Suscripción' }); });
    debts
      .filter(d => (d.totalAmount - (d.paidAmount || 0)) > 0 && (d.minimumPayment || 0) > 0)
      .forEach(d => items.push({ id: `d-${d.id}`, name: d.name || d.creditor || 'Deuda', amount: d.minimumPayment, tipo: 'Pago mínimo' }));
    return items;
  }, [subs, debts]);

  const totalGastosFijosPresupuesto = useMemo(() => gastosFijosPresupuesto.reduce((a, g) => a + g.amount, 0), [gastosFijosPresupuesto]);
  const totalVariablePresupuestado = useMemo(() => Object.values(budgetCats).reduce((a, v) => a + v, 0), [budgetCats]);
  const totalPresupuestado = totalVariablePresupuestado + totalGastosFijosPresupuesto;
  const tasaAhorro = ingresosMes > 0 ? Math.max(0, ((ingresosMes - gastosMes) / ingresosMes) * 100) : 0;

  const budgetChartData = useMemo(() => {
    return CATEGORIAS
      .map(cat => ({
        cat: cat.length > 8 ? cat.slice(0, 7) + '.' : cat,
        fullName: cat,
        Presupuesto: budgetCats[cat] || 0,
        Gastado: gastosMesPorCat[cat] || 0,
      }))
      .filter(d => d.Presupuesto > 0 || d.Gastado > 0)
      .sort((a, b) => b.Presupuesto - a.Presupuesto);
  }, [budgetCats, gastosMesPorCat]);

  const regla5030 = useMemo(() => {
    const base = ingresoObjetivo > 0 ? ingresoObjetivo : ingresosMes;
    const necesidades = ['Vivienda', 'Comida', 'Transporte', 'Salud', 'Estudios'].reduce((a, c) => a + (gastosMesPorCat[c] || 0), 0);
    const deseos = ['Entretenimiento', 'Gimnasio', 'Suscripciones', 'Otros'].reduce((a, c) => a + (gastosMesPorCat[c] || 0), 0);
    const ahorroReal = ingresosMes - gastosMes;
    return { necesidades, deseos, ahorroReal, base };
  }, [gastosMesPorCat, ingresosMes, gastosMes, ingresoObjetivo]);

  const proyeccion = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const diasRestantes = daysInMonth - dayOfMonth;
    const dailyBurn = dayOfMonth > 0 ? gastosMes / dayOfMonth : 0;
    const proyectado = Math.round(dailyBurn * daysInMonth);
    const base = totalPresupuestado > 0 ? totalPresupuestado : (ingresoObjetivo > 0 ? ingresoObjetivo : ingresosMes);
    return { daysInMonth, dayOfMonth, diasRestantes, dailyBurn, proyectado, base, overBudget: base > 0 && proyectado > base };
  }, [gastosMes, totalPresupuestado, ingresoObjetivo, ingresosMes]);

  const alertas = useMemo(() => {
    const list = [];
    CATEGORIAS.forEach(cat => {
      const limit = budgetCats[cat] || 0;
      const spent = gastosMesPorCat[cat] || 0;
      if (limit > 0) {
        const pct = (spent / limit) * 100;
        if (pct >= 100) list.push({ type: 'danger', cat, msg: `Excedido ${fmt(spent - limit)}`, pct });
        else if (pct >= 80) list.push({ type: 'warning', cat, msg: `${pct.toFixed(0)}% · Quedan ${fmt(limit - spent)}`, pct });
      }
    });
    return list.sort((a, b) => b.pct - a.pct);
  }, [budgetCats, gastosMesPorCat]);

  const healthScore = useMemo(() => {
    let score = 100;
    let factors = 0;
    if (totalPresupuestado > 0) {
      factors++;
      if (gastosMes > totalPresupuestado) score -= 25;
      else if (gastosMes > totalPresupuestado * 0.9) score -= 8;
      const overCats = CATEGORIAS.filter(c => (budgetCats[c] || 0) > 0 && (gastosMesPorCat[c] || 0) > (budgetCats[c] || 0)).length;
      score -= Math.min(overCats * 5, 20);
    }
    if (ingresosMes > 0) {
      factors++;
      if (tasaAhorro < 0) score -= 30;
      else if (tasaAhorro < 10) score -= 20;
      else if (tasaAhorro < 20) score -= 10;
    }
    if (regla5030.base > 0) {
      factors++;
      if (regla5030.necesidades > regla5030.base * 0.6) score -= 8;
      if (regla5030.deseos > regla5030.base * 0.35) score -= 5;
    }
    return factors > 0 ? Math.max(0, Math.min(100, score)) : null;
  }, [totalPresupuestado, gastosMes, budgetCats, gastosMesPorCat, tasaAhorro, ingresosMes, regla5030]);

  /* ── area chart data ── */
  const areaData = useMemo(() => {
    const groups = {};
    transacciones.forEach((t) => {
      const key = getMonthKey(t.fecha);
      if (!groups[key]) groups[key] = { ingreso: 0, gasto: 0 };
      if (t.tipo === 'ingreso') groups[key].ingreso += t.monto;
      else groups[key].gasto += t.monto;
    });
    return Object.entries(groups)
      .map(([month, d]) => ({ month, label: fmtMonthLabel(month), ingreso: d.ingreso, gasto: d.gasto }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [transacciones]);

  /* ── donut 1: gastos por categoría ── */
  const catDonutData = useMemo(() => {
    const totals = {};
    transacciones.filter((t) => t.tipo === 'gasto').forEach((t) => {
      const cat = t.categoria || 'Otros';
      totals[cat] = (totals[cat] || 0) + t.monto;
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name, value, fill: CAT_COLORS[i % CAT_COLORS.length],
        pct: total > 0 ? (value / total) * 100 : 0,
      }));
  }, [transacciones]);

  /* ── donut 2: ingresos vs gastos del mes ── */
  const mesDonutData = useMemo(() => {
    if (ingresosMes === 0 && gastosMes === 0) return [];
    return [
      { name: 'Ingresos', value: ingresosMes, fill: '#10b981', pct: ingresosMes + gastosMes > 0 ? (ingresosMes / (ingresosMes + gastosMes)) * 100 : 0 },
      { name: 'Gastos', value: gastosMes, fill: '#f43f5e', pct: ingresosMes + gastosMes > 0 ? (gastosMes / (ingresosMes + gastosMes)) * 100 : 0 },
    ];
  }, [ingresosMes, gastosMes]);

  /* ── transactions table ── */
  const transaccionesFiltradas = useMemo(() => {
    let list = [...transacciones];
    if (filtroCategoria !== 'Todos') list = list.filter((t) => (t.categoria || 'Otros') === filtroCategoria);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      list = list.filter((t) =>
        (t.descripcion || '').toLowerCase().includes(q) || (t.categoria || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => orden === 'newest' ? new Date(b.fecha) - new Date(a.fecha) : new Date(a.fecha) - new Date(b.fecha));
    return list.slice(0, 8);
  }, [transacciones, filtroCategoria, busqueda, orden]);

  /* ── deudas activas ── */
  const deudasActivas = useMemo(
    () => debts.filter((d) => (d.totalAmount - (d.paidAmount || 0)) > 0).slice(0, 3),
    [debts],
  );
  const abonosConNombre = useMemo(
    () => recentAbonos.map((a) => ({
      ...a,
      debtName: debts.find((d) => d.id === a.deuda_id)?.name || debts.find((d) => d.id === a.deuda_id)?.creditor || 'Deuda eliminada',
    })),
    [recentAbonos, debts],
  );

  /* ── handlers ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !descripcion) return;
    const montoVal = safeParseFloat(monto);
    if (montoVal <= 0) { addToast('El monto debe ser mayor a 0', 'warning'); return; }
    const tipoVal = validateEnum(tipo, ALLOWED_TIPOS, 'gasto');
    const catVal = validateEnum(categoria, ALLOWED_CATEGORIES, 'Otros');
    const cacheKey = 'finanzas_cache';
    const newTx = { id: crypto.randomUUID(), monto: montoVal, amount: montoVal, tipo: tipoVal, descripcion: sanitizeInput(descripcion), categoria: catVal, fecha: new Date().toISOString(), user_id: user?.id };

    if (supabaseReady) {
      try {
        const { error } = await supabase.from('finanzas').insert([enrichWithUser({ monto: montoVal, amount: montoVal, tipo: tipoVal, descripcion: sanitizeInput(descripcion), categoria: catVal, fecha: new Date().toISOString() }, user)]);
        if (error) throw error;
      } catch {
        const cached = await db.getItem(cacheKey) || [];
        cached.unshift(newTx);
        await db.setItem(cacheKey, cached);
        setTransacciones(cached);
        addToast('Guardado localmente (sin conexión)', 'warning');
        setMonto(''); setDescripcion(''); setCategoria('Otros');
        return;
      }
    } else {
      const cached = await db.getItem(cacheKey) || [];
      cached.unshift(newTx);
      await db.setItem(cacheKey, cached);
      setTransacciones(cached);
    }
    addToast('Movimiento registrado', 'success');
    setMonto(''); setDescripcion(''); setCategoria('Otros');
    setShowForm(false);
    setRefrescar((c) => c + 1);
  };

  const handleDelete = async (id) => {
    if (supabaseReady) {
      try {
        const { error } = await supabase.from('finanzas').delete().eq('id', id).eq('user_id', user.id);
        if (error) { addToast('Error al eliminar', 'error'); return; }
      } catch (err) { addToast('Error al eliminar', 'error'); return; }
    }
    const cached = await db.getItem('finanzas_cache') || [];
    const filtered = cached.filter((t) => t.id !== id);
    await db.setItem('finanzas_cache', filtered);
    setTransacciones(filtered);
    addToast('Movimiento eliminado', 'success');
  };

  const handleSaveBudget = async () => {
    const validated = {};
    Object.entries(budgetDraft).forEach(([cat, val]) => { validated[cat] = Math.max(0, safeParseFloat(val)); });
    setBudgetCats(validated);
    setIngresoObjetivo(Math.max(0, safeParseFloat(ingresoObjDraft)));
    setEditingBudget(false);
    if (supabaseReady && user) {
      try {
        const { error } = await supabase
          .from('presupuesto')
          .upsert({ user_id: user.id, categorias: validated, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (error) throw error;
        addToast('Presupuesto guardado en la nube', 'success');
      } catch {
        addToast('Presupuesto guardado localmente', 'warning');
      }
    } else {
      addToast('Presupuesto guardado', 'success');
    }
  };

  const exportCSV = () => {
    const header = 'Tipo,Categoría,Descripción,Fecha,Monto\n';
    const rows = transacciones.map((t) => `"${sanitizeCSVField(t.tipo)}","${sanitizeCSVField(t.categoria || 'Otros')}","${sanitizeCSVField(t.descripcion || '')}","${t.fecha}",${t.monto}`).join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `finanzas_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exportado', 'success');
  };

  const grade = getHealthGrade(healthScore);

  /* ── loading / not configured ── */
  if (cargando) return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-textMuted-light dark:text-textMuted-dark" />
    </div>
  );

  if (!supabaseReady) return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
      <div className="text-center p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <p className="text-sm text-textMuted-light dark:text-textMuted-dark">Configura <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">VITE_SUPABASE_URL</code> y <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">VITE_SUPABASE_ANON_KEY</code></p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors mb-2">
              <ArrowLeft size={13} /> Volver
            </Link>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wallet size={22} className="text-emerald-500" />
              Finanzas
            </h1>
            <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-0.5">
              {new Date().toLocaleDateString(LOCALE, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="p-2 rounded-xl border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
              title="Exportar CSV"
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
            >
              <Plus size={15} />
              Nuevo
            </button>
          </div>
        </div>

        {/* ── Form ── */}
        {showForm && (
          <div className="mb-6 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <h2 className="text-sm font-semibold text-text-light dark:text-text-dark mb-3">Nuevo Movimiento</h2>
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
              <input type="number" step="0.01" min="0" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40 w-32" />
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Descripción..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                className="flex-1 min-w-[160px] px-3 py-2 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-[#0B0F19] text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
              <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                Guardar
              </button>
            </form>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Wallet}      iconColor="text-blue-600 dark:text-blue-400"    iconBg="bg-blue-50 dark:bg-blue-900/30"    label="Balance Total"     value={fmt(balance)}      pct={undefined} />
          <KpiCard icon={TrendingUp}  iconColor="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-50 dark:bg-emerald-900/30" label="Ingresos del Mes"  value={fmt(ingresosMes)}  pct={pctIngresos}  pctPositiveIsGood={true} />
          <KpiCard icon={TrendingDown} iconColor="text-rose-600 dark:text-rose-400"   iconBg="bg-rose-50 dark:bg-rose-900/30"    label="Gastos del Mes"    value={fmt(gastosMes)}    pct={pctGastos}   pctPositiveIsGood={false} />
          <KpiCard icon={PiggyBank}   iconColor="text-violet-600 dark:text-violet-400" iconBg="bg-violet-50 dark:bg-violet-900/30" label="Ahorro Total"      value={fmt(ahorroTotal)}  pct={undefined} />
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ─── Left Column (3/4) ─── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Area Chart */}
            {areaData.length > 0 && (
              <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
                <h2 className="font-semibold text-sm text-text-light dark:text-text-dark mb-1">Ingresos vs Gastos</h2>
                <p className="text-xs text-textMuted-light dark:text-textMuted-dark mb-4">Últimos {areaData.length} meses</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gradIngreso" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<AreaTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <Area type="monotone" dataKey="ingreso" name="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gradIngreso)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                    <Area type="monotone" dataKey="gasto"   name="Gastos"   stroke="#f43f5e" strokeWidth={2} fill="url(#gradGasto)"   dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Transactions Table */}
            <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-semibold text-sm text-text-light dark:text-text-dark">Transacciones Recientes</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted-light dark:text-textMuted-dark pointer-events-none" />
                    <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-7 pr-2 py-1.5 text-xs rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40 w-28" />
                  </div>
                  <Filter size={13} className="text-textMuted-light dark:text-textMuted-dark" />
                  <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                    <option value="Todos">Todas</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={orden} onChange={(e) => setOrden(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                    <option value="newest">Más reciente</option>
                    <option value="oldest">Más antiguo</option>
                  </select>
                </div>
              </div>

              {transaccionesFiltradas.length === 0 ? (
                <p className="text-sm text-textMuted-light dark:text-textMuted-dark text-center py-8">Sin movimientos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.05] text-[11px] uppercase tracking-wider text-textMuted-light dark:text-textMuted-dark">
                        <th className="text-left pb-3 pr-3 font-medium w-9" />
                        <th className="text-left pb-3 pr-3 font-medium">Descripción</th>
                        <th className="text-left pb-3 pr-3 font-medium hidden sm:table-cell">Categoría</th>
                        <th className="text-left pb-3 pr-3 font-medium hidden md:table-cell">Tipo</th>
                        <th className="text-left pb-3 pr-3 font-medium hidden sm:table-cell">Fecha</th>
                        <th className="text-right pb-3 font-medium">Monto</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {transaccionesFiltradas.map((t) => {
                        const isIngreso = t.tipo === 'ingreso';
                        return (
                          <tr key={t.id} className="border-b border-slate-100/80 dark:border-white/[0.04] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="py-3 pr-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isIngreso ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                {isIngreso
                                  ? <ArrowDownLeft size={13} className="text-emerald-600 dark:text-emerald-400" />
                                  : <ArrowUpRight size={13} className="text-rose-600 dark:text-rose-400" />}
                              </div>
                            </td>
                            <td className="py-3 pr-3">
                              <p className="text-sm font-medium text-text-light dark:text-text-dark leading-tight">{t.descripcion}</p>
                              <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark mt-0.5 sm:hidden">{t.categoria || 'Otros'} · {fmtDate(t.fecha)}</p>
                            </td>
                            <td className="py-3 pr-3 hidden sm:table-cell">
                              <span className="text-xs text-textMuted-light dark:text-textMuted-dark">{t.categoria || 'Otros'}</span>
                            </td>
                            <td className="py-3 pr-3 hidden md:table-cell">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${isIngreso ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isIngreso ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {isIngreso ? 'Ingreso' : 'Gasto'}
                              </span>
                            </td>
                            <td className="py-3 pr-3 hidden sm:table-cell">
                              <span className="text-xs text-textMuted-light dark:text-textMuted-dark tabular-nums">{fmtDate(t.fecha)}</span>
                            </td>
                            <td className={`py-3 text-right text-sm font-bold tabular-nums whitespace-nowrap ${isIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isIngreso ? '+' : '-'}{fmt(t.monto)}
                            </td>
                            <td className="py-3 pl-2">
                              <button onClick={() => handleDelete(t.id)} className="p-1 rounded-lg text-textMuted-light dark:text-textMuted-dark opacity-0 group-hover:opacity-100 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all" aria-label="Eliminar">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagos Recientes (abonos) */}
            {abonosConNombre.length > 0 && (
              <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm text-text-light dark:text-text-dark flex items-center gap-2">
                    <TrendingDown size={14} className="text-emerald-500" /> Pagos Recientes
                  </h2>
                  <Link to="/deudas" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Ver todo →</Link>
                </div>
                {loadingAbonos ? (
                  <div className="py-4 text-center"><Loader2 size={16} className="animate-spin text-textMuted-light dark:text-textMuted-dark mx-auto" /></div>
                ) : (
                  <div className="space-y-1.5">
                    {abonosConNombre.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-bg-light dark:bg-bg-dark">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                            <TrendingDown size={12} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">{a.debtName}</p>
                            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                              {new Date(a.fecha).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })}{a.nota ? ` · ${a.nota}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400 ml-2 shrink-0">-{fmt(a.cantidad_abonada || a.amount_paid || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Right Column (1/4) ─── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Donut 1: Gastos por Categoría */}
            <DonutCard
              title="Gastos por Categoría"
              data={catDonutData}
              centerLabel="Total gastos"
              centerValue={fmt(catDonutData.reduce((a, d) => a + d.value, 0))}
              centerColor="text-rose-600 dark:text-rose-400"
            />

            {/* Donut 2: Ingresos vs Gastos del mes */}
            <DonutCard
              title={`Balance ${fmtMonthLabel(mesActualKey)}`}
              data={mesDonutData}
              centerLabel={ingresosMes >= gastosMes ? 'Superávit' : 'Déficit'}
              centerValue={fmt(Math.abs(ingresosMes - gastosMes))}
              centerColor={ingresosMes >= gastosMes ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
            />

            {/* Pagos Programados */}
            {(deudasActivas.length > 0 || subs.length > 0) && (
              <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-text-light dark:text-text-dark flex items-center gap-2">
                    <CalendarDays size={14} className="text-blue-500" /> Pagos Pendientes
                  </h3>
                  <Link to="/deudas" className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Ver →</Link>
                </div>
                <div className="space-y-1.5">
                  {deudasActivas.map((d, idx) => {
                    const remaining = d.totalAmount - (d.paidAmount || 0);
                    const progress = d.totalAmount > 0 ? ((d.paidAmount || 0) / d.totalAmount) * 100 : 0;
                    return (
                      <Link key={d.id} to="/deudas" className="block p-2.5 rounded-xl bg-bg-light dark:bg-bg-dark hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                              {idx === 0
                                ? <AlertTriangle size={10} className="text-rose-500" />
                                : <CalendarDays size={10} className="text-blue-500" />}
                            </div>
                            <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">{d.name || d.creditor}</p>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-text-light dark:text-text-dark ml-2 shrink-0">{fmt(remaining)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-1">{Math.round(progress)}% pagado</p>
                      </Link>
                    );
                  })}
                  {subs.slice(0, 2).map((s) => {
                    const days = Math.ceil((new Date(s.renewalDate) - new Date()) / 86400000);
                    return (
                      <Link key={s.id} to="/suscripciones" className="block p-2.5 rounded-xl bg-bg-light dark:bg-bg-dark hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                              <PlaySquare size={10} className="text-violet-500" />
                            </div>
                            <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">{s.name}</p>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-text-light dark:text-text-dark ml-2 shrink-0">{fmt(s.cost)}</span>
                        </div>
                        <p className={`text-[10px] mt-0.5 ml-7 ${days <= 5 ? 'text-orange-500 font-semibold' : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                          {days < 0 ? 'Vencido' : days === 0 ? '¡Hoy!' : `En ${days} días`}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PRESUPUESTO MENSUAL
        ══════════════════════════════════════════════════════════ */}
        <div className="mt-10 border-t border-border-light dark:border-border-dark pt-10">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                Presupuesto Mensual
              </h2>
              <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-0.5">
                {new Date().toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })}
                {ingresosMes > 0 && <span className="ml-2">· Ingresos del mes: <strong>{fmt(ingresosMes)}</strong></span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {editingBudget ? (
                <>
                  <button
                    onClick={handleSaveBudget}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                  >
                    <Check size={13} /> Guardar
                  </button>
                  <button
                    onClick={() => setEditingBudget(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-light dark:border-border-dark text-xs font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                  >
                    <X size={13} /> Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setBudgetDraft({ ...budgetCats }); setIngresoObjDraft(ingresoObjetivo > 0 ? String(ingresoObjetivo) : ''); setEditingBudget(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-light dark:border-border-dark text-xs font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                >
                  <Edit3 size={13} /> Editar presupuesto
                </button>
              )}
            </div>
          </div>

          {/* Intelligence cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            {/* Health Score */}
            <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${grade.bg}`}>
                <span className={`text-3xl font-black leading-none ${grade.color}`}>{grade.grade}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">Salud Financiera</p>
                <p className={`text-base font-bold ${grade.color}`}>{grade.label}</p>
                <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark">
                  {healthScore !== null ? `${healthScore} / 100 puntos` : 'Registra datos para calcular'}
                </p>
              </div>
            </div>

            {/* Proyección fin de mes */}
            <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CalendarDays size={11} /> Proyección Fin de Mes
              </p>
              <p className={`text-xl font-bold tabular-nums ${proyeccion.overBudget ? 'text-rose-600 dark:text-rose-400' : 'text-text-light dark:text-text-dark'}`}>
                {fmt(proyeccion.proyectado)}
              </p>
              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">
                {fmt(Math.round(proyeccion.dailyBurn))}/día · {proyeccion.diasRestantes} días restantes
              </p>
              {proyeccion.base > 0 && (
                <>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${proyeccion.overBudget ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (proyeccion.proyectado / proyeccion.base) * 100)}%` }}
                    />
                  </div>
                  <p className={`text-[10px] mt-0.5 font-medium ${proyeccion.overBudget ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {proyeccion.overBudget
                      ? `⚠ ${fmt(proyeccion.proyectado - proyeccion.base)} sobre presupuesto`
                      : `✓ ${fmt(proyeccion.base - proyeccion.proyectado)} por debajo`}
                  </p>
                </>
              )}
            </div>

            {/* Ingreso objetivo */}
            <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-2">Ingreso Objetivo del Mes</p>
              {editingBudget ? (
                <input
                  type="number" min="0" step="500"
                  value={ingresoObjDraft}
                  onChange={e => setIngresoObjDraft(e.target.value)}
                  placeholder="Ej. 25000"
                  className="w-full px-3 py-1.5 text-lg font-bold rounded-xl border border-blue-400 dark:border-blue-600 bg-white dark:bg-[#0B0F19] text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 tabular-nums"
                />
              ) : (
                <p className="text-xl font-bold tabular-nums text-text-light dark:text-text-dark">
                  {ingresoObjetivo > 0 ? fmt(ingresoObjetivo) : '—'}
                </p>
              )}
              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-1 leading-relaxed">
                {ingresoObjetivo > 0
                  ? ingresosMes >= ingresoObjetivo
                    ? `✓ Alcanzado · registrado: ${fmt(ingresosMes)}`
                    : `Falta ${fmt(ingresoObjetivo - ingresosMes)} · registrado: ${fmt(ingresosMes)}`
                  : 'Base para 50/30/20 antes de cobrar · edita para activar'}
              </p>
            </div>
          </div>

          {/* Alertas */}
          {alertas.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                {alertas.filter(a => a.type === 'danger').length > 0 && `${alertas.filter(a => a.type === 'danger').length} categoría${alertas.filter(a => a.type === 'danger').length > 1 ? 's' : ''} excedida${alertas.filter(a => a.type === 'danger').length > 1 ? 's' : ''}`}
                {alertas.filter(a => a.type === 'danger').length > 0 && alertas.filter(a => a.type === 'warning').length > 0 && ' · '}
                {alertas.filter(a => a.type === 'warning').length > 0 && `${alertas.filter(a => a.type === 'warning').length} cerca del límite`}
              </p>
              <div className="flex flex-wrap gap-2">
                {alertas.map(a => (
                  <span key={a.cat} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    a.type === 'danger'
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.type === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    {a.cat}: {a.msg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-1">Total Presupuestado</p>
              <p className="text-lg font-bold text-text-light dark:text-text-dark tabular-nums">{fmt(totalPresupuestado)}</p>
              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Fijo {fmt(totalGastosFijosPresupuesto)} + Variable {fmt(totalVariablePresupuestado)}</p>
            </div>
            <div className={`p-4 rounded-2xl border bg-surface-light dark:bg-surface-dark ${gastosMes > totalPresupuestado && totalPresupuestado > 0 ? 'border-rose-300 dark:border-rose-800' : 'border-border-light dark:border-border-dark'}`}>
              <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-1">Total Gastado</p>
              <p className={`text-lg font-bold tabular-nums ${gastosMes > totalPresupuestado && totalPresupuestado > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-text-light dark:text-text-dark'}`}>{fmt(gastosMes)}</p>
              {totalPresupuestado > 0 && (
                <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">{Math.min(100, Math.round((gastosMes / totalPresupuestado) * 100))}% del presupuesto</p>
              )}
            </div>
            <div className={`p-4 rounded-2xl border bg-surface-light dark:bg-surface-dark ${(ingresosMes - gastosMes) < 0 ? 'border-rose-300 dark:border-rose-800' : 'border-border-light dark:border-border-dark'}`}>
              <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-1">Remanente del Mes</p>
              <p className={`text-lg font-bold tabular-nums ${(ingresosMes - gastosMes) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {fmt(ingresosMes - gastosMes)}
              </p>
              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">Ingresos − gastos del mes</p>
            </div>
            <div className="p-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
              <p className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide mb-1">Tasa de Ahorro</p>
              <p className={`text-lg font-bold tabular-nums ${tasaAhorro >= 20 ? 'text-emerald-600 dark:text-emerald-400' : tasaAhorro >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {tasaAhorro.toFixed(1)}%
              </p>
              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark mt-0.5">
                Meta: ≥20% · {tasaAhorro >= 20 ? '✓ En rango' : tasaAhorro >= 10 ? '~ Cerca' : '✗ Por debajo'}
              </p>
            </div>
          </div>

          {/* Budget main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: category list + chart */}
            <div className="lg:col-span-2 space-y-5">

              {/* Category limits with prev-month comparison */}
              <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm text-text-light dark:text-text-dark">Límites por Categoría</h3>
                    <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark mt-0.5">
                      {editingBudget ? 'Ingresa el límite máximo mensual' : 'Gasto real vs límite · vs mes anterior'}
                    </p>
                  </div>
                  {!editingBudget && (
                    <div className="flex items-center gap-3 text-[10px] text-textMuted-light dark:text-textMuted-dark shrink-0">
                      <span><span className="text-rose-500 font-bold">↑</span> más</span>
                      <span><span className="text-emerald-500 font-bold">↓</span> menos</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {CATEGORIAS.map(cat => {
                    const budgeted = editingBudget ? (safeParseFloat(budgetDraft[cat]) || 0) : (budgetCats[cat] || 0);
                    const spent = gastosMesPorCat[cat] || 0;
                    const prevSpent = gastosMesPorCatPrevMes[cat] || 0;
                    const pct = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;
                    const over = budgeted > 0 && spent > budgeted;
                    const pctVsPrev = prevSpent > 0 ? ((spent - prevSpent) / prevSpent) * 100 : null;
                    const barColor = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
                    const hasActivity = spent > 0 || budgeted > 0;
                    if (!hasActivity && !editingBudget) return null;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium text-text-light dark:text-text-dark w-28 shrink-0 truncate">{cat}</span>
                          {over && !editingBudget && <span className="text-[10px] font-bold text-rose-500 shrink-0">¡Excedido!</span>}
                          {!budgeted && spent > 0 && !editingBudget && (
                            <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark shrink-0 italic">sin límite</span>
                          )}
                          <div className="flex items-center gap-2 ml-auto shrink-0">
                            {!editingBudget && pctVsPrev !== null && Math.abs(pctVsPrev) >= 5 && (
                              <span className={`text-[10px] font-bold shrink-0 ${pctVsPrev > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {pctVsPrev > 0 ? '↑' : '↓'}{Math.abs(pctVsPrev).toFixed(0)}%
                              </span>
                            )}
                            <span className={`text-xs font-semibold tabular-nums ${over ? 'text-rose-600 dark:text-rose-400' : spent > 0 ? 'text-text-light dark:text-text-dark' : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                              {fmt(spent)}
                            </span>
                            {editingBudget ? (
                              <input
                                type="number" min="0" step="100"
                                value={budgetDraft[cat] ?? ''}
                                onChange={e => setBudgetDraft(p => ({ ...p, [cat]: e.target.value }))}
                                placeholder="0"
                                className="w-24 px-2 py-0.5 text-xs rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-[#0B0F19] text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 tabular-nums text-right"
                              />
                            ) : (
                              <span className="text-xs text-textMuted-light dark:text-textMuted-dark tabular-nums w-20 text-right">
                                {budgeted > 0 ? `/ ${fmt(budgeted)}` : '—'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          {budgeted > 0
                            ? <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
                            : spent > 0
                            ? <div className="h-full rounded-full bg-slate-300 dark:bg-white/15 w-full" />
                            : <div className="h-full rounded-full bg-slate-100 dark:bg-white/5 w-full" />}
                        </div>
                        {budgeted > 0 && !editingBudget && (
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{pct.toFixed(0)}% usado</span>
                            {budgeted - spent > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Disponible: {fmt(budgeted - spent)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bar chart */}
              {budgetChartData.length > 0 && (
                <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                  <h3 className="font-semibold text-sm text-text-light dark:text-text-dark mb-1">Presupuesto vs Gastado</h3>
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark mb-4">Comparativa por categoría este mes</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={budgetChartData} barCategoryGap="30%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <XAxis dataKey="cat" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={68} />
                      <Tooltip content={<BudgetBarTooltip />} />
                      <Bar dataKey="Presupuesto" fill="#6366f1" fillOpacity={0.55} radius={[3, 3, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="Gastado" fill="#f43f5e" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-5 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: '#6366f1', opacity: 0.55 }} />
                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark">Presupuesto</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: '#f43f5e', opacity: 0.85 }} />
                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark">Gastado</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: fixed expenses + 50/30/20 */}
            <div className="space-y-5">

              {/* Gastos fijos auto */}
              <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-text-light dark:text-text-dark flex items-center gap-2">
                    <DollarSign size={14} className="text-violet-500" />
                    Gastos Fijos
                  </h3>
                  <span className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-400">{fmt(totalGastosFijosPresupuesto)}</span>
                </div>
                {gastosFijosPresupuesto.length === 0 ? (
                  <p className="text-xs text-textMuted-light dark:text-textMuted-dark text-center py-4 leading-relaxed">
                    Las suscripciones activas y pagos mínimos de deudas aparecerán aquí automáticamente.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {gastosFijosPresupuesto.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-bg-light dark:bg-bg-dark gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">{item.name}</p>
                          <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{item.tipo}</p>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400 shrink-0">{fmt(item.amount)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
                      <span className="text-[11px] text-textMuted-light dark:text-textMuted-dark font-medium">Total mensual fijo</span>
                      <span className="text-[11px] font-bold tabular-nums text-violet-600 dark:text-violet-400">{fmt(totalGastosFijosPresupuesto)}</span>
                    </div>
                    {regla5030.base > 0 && (
                      <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                        {((totalGastosFijosPresupuesto / regla5030.base) * 100).toFixed(0)}% de tu ingreso {ingresoObjetivo > 0 ? 'objetivo' : 'del mes'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 50/30/20 */}
              <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                <h3 className="font-semibold text-sm text-text-light dark:text-text-dark mb-0.5">Regla 50 / 30 / 20</h3>
                <p className="text-[11px] text-textMuted-light dark:text-textMuted-dark mb-4">
                  {regla5030.base > 0
                    ? `Base: ${fmt(regla5030.base)}${ingresoObjetivo > 0 ? ' (objetivo)' : ' (ingresos reales)'}`
                    : 'Define un ingreso objetivo o registra ingresos para activar'}
                </p>
                {regla5030.base > 0 ? (
                  <div className="space-y-4">
                    {[
                      { label: '50% Necesidades', subLabel: 'Vivienda, Comida, Salud, Transporte', pctTarget: 50, spent: regla5030.necesidades, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', isSavings: false },
                      { label: '30% Deseos', subLabel: 'Entretenimiento, Gimnasio, Otros', pctTarget: 30, spent: regla5030.deseos, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', isSavings: false },
                      { label: '20% Ahorro / Deudas', subLabel: 'Lo que queda después de gastos', pctTarget: 20, spent: regla5030.ahorroReal, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', isSavings: true },
                    ].map(({ label, subLabel, pctTarget, spent, color, textColor, isSavings }) => {
                      const target = regla5030.base * (pctTarget / 100);
                      const good = isSavings ? spent >= target : spent <= target;
                      const pctUsed = target > 0 ? Math.min(100, (Math.max(0, spent) / target) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <p className="text-xs font-semibold text-text-light dark:text-text-dark">{label}</p>
                              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">{subLabel}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-xs font-bold tabular-nums ${good ? textColor : 'text-rose-600 dark:text-rose-400'}`}>{fmt(Math.abs(spent))}</p>
                              <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">/ {fmt(target)}</p>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${good ? color : 'bg-rose-500'}`} style={{ width: `${pctUsed}%` }} />
                          </div>
                          <p className="text-[10px] mt-0.5 flex items-center gap-1">
                            <span className={good ? 'text-emerald-500' : 'text-rose-500'}>{good ? '✓' : '✗'}</span>
                            <span className="text-textMuted-light dark:text-textMuted-dark">
                              {isSavings
                                ? good ? 'En rango' : `Faltan ${fmt(target - Math.max(0, spent))}`
                                : good ? 'En rango' : `Excedido ${fmt(Math.max(0, spent) - target)}`}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: '50% Necesidades', color: 'bg-blue-400/25' },
                      { label: '30% Deseos', color: 'bg-amber-400/25' },
                      { label: '20% Ahorro / Deudas', color: 'bg-emerald-400/25' },
                    ].map(g => (
                      <div key={g.label}>
                        <p className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark mb-1.5">{g.label}</p>
                        <div className={`h-2 rounded-full ${g.color}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
