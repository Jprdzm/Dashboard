import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Filter, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { enrichWithUser } from '../services/withUser';

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
    <div className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs shadow-sm">
      <p className="font-medium text-text-light dark:text-text-dark mb-1">{label}</p>
      <p className={val >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !descripcion) return;
    if (!supabaseReady) return;

    try {
      const { error } = await supabase
        .from('finanzas')
        .insert([enrichWithUser({
          monto: parseFloat(monto),
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
        <div className="text-center max-w-sm p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
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
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Balance General
            </span>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Ingresos
            </span>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {formatCurrency(totalIngresos)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Gastos
            </span>
            <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {formatCurrency(totalGastos)}
            </p>
          </div>
        </div>

        {datosBarraMensual.length > 0 && (
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
            <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
              Balance Neto por Mes
              <span className="ml-2 text-xs font-normal text-textMuted-light dark:text-textMuted-dark">
                — haz clic en una barra para ver su desglose
              </span>
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={datosBarraMensual} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonthLabel}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
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
                          ? entry.netBalance >= 0 ? '#16a34a' : '#dc2626'
                          : entry.netBalance >= 0 ? '#86efac' : '#fca5a5'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

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
                    <span>Ingresos: <strong className="text-green-600 dark:text-green-400">{formatCurrency(subIngreso)}</strong></span>
                    <span>Gastos: <strong className="text-red-600 dark:text-red-400">{formatCurrency(subGasto)}</strong></span>
                    <span>Neto: <strong className={subIngreso - subGasto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(subIngreso - subGasto)}</strong></span>
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
                            <td className={`py-1.5 pl-2 text-right font-medium tabular-nums whitespace-nowrap text-xs ${t.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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

        {Object.keys(totalesPorCategoria.totals).length > 0 && (
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark mb-8">
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
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
                Últimos 7 Días
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-2 font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 font-medium">Descripción</th>
                    <th className="text-left py-2 px-2 font-medium hidden sm:table-cell">Categoría</th>
                    <th className="text-right py-2 pl-2 font-medium">Monto</th>
                    <th className="text-right py-2 pl-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {recientesFiltradas.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border-light dark:border-border-dark hover:bg-bg-light dark:hover:bg-bg-dark transition-colors"
                    >
                      <td className="py-2.5 pr-2 text-textMuted-light dark:text-textMuted-dark whitespace-nowrap">
                        {formatDate(t.fecha)}
                      </td>
                      <td className="py-2.5 px-2 text-text-light dark:text-text-dark">{t.descripcion}</td>
                      <td className="py-2.5 px-2 text-textMuted-light dark:text-textMuted-dark hidden sm:table-cell">
                        {t.categoria || 'Otros'}
                      </td>
                      <td className={`py-2.5 pl-2 text-right font-medium tabular-nums whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
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
