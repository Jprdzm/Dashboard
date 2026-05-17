# Rediseño FinanzasPage.jsx — Plan de implementación

## 1. Cambiar imports (línea 3-5)

**Antes:**
```js
import {
  ArrowLeft, Plus, Trash2, Filter, Loader2,
} from 'lucide-react';
```

**Después:**
```js
import {
  ArrowLeft, Plus, Trash2, Filter, Loader2,
  Wallet, CreditCard, TrendingUp, TrendingDown, PiggyBank, Calendar,
} from 'lucide-react';
```

---

## 2. Agregar nuevos useMemo DESPUÉS de `totalGastos` (después de línea 159)

Agregar justo después del `useMemo` de `totalGastos` (después de `}, [transacciones]);`):

```js
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
```

---

## 3. Reemplazar todo el bloque `return (...)` (desde línea 240 hasta el final)

Reemplazar TODO desde `return (` (línea 240) hasta el final del archivo (línea 564) con:

```jsx
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

          {/* ── Card 1: Balance Total ── */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Balance Total
            </span>
            <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(balance)}
            </p>
          </div>

          {/* ── Card 2: Ingresos del Mes ── */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Ingresos del Mes
            </span>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {formatCurrency(ingresosMes)}
            </p>
          </div>

          {/* ── Card 3: Gastos del Mes ── */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <TrendingDown size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Gastos del Mes
            </span>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {formatCurrency(gastosMes)}
            </p>
          </div>

          {/* ── Card 4: Metas de Ahorro ── */}
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
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

            {/* Historial de Transacciones (Últimos 7 Días) */}
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
                          <td className={`py-2.5 pl-2 text-right font-medium tabular-nums whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
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

          {/* ─────── Columna Derecha (1/4) ─────── */}
          <div className="lg:col-span-1 space-y-6">

            {/* ── Tarjeta Premium (simulación crédito) ── */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-white overflow-hidden shadow-lg">
              {/* Efecto decorativo */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5 blur-lg" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <CreditCard size={22} className="text-white/80" />
                  <span className="text-[10px] font-medium tracking-widest text-white/60 uppercase">
                    Crédito
                  </span>
                </div>

                {/* Número de tarjeta simulado */}
                <p className="text-lg tracking-[4px] font-mono mb-4 text-white/90">
                  **** **** **** 4832
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-wide mb-0.5">Titular</p>
                    <p className="text-sm font-medium text-white/90">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/50 uppercase tracking-wide mb-0.5">Vence</p>
                    <p className="text-sm font-medium text-white/90">12/28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Próximos Pagos / Deudas ── */}
            <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
              <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm flex items-center gap-2">
                <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                Próximos Pagos
              </h2>

              <div className="space-y-3">
                {/* Item 1 - simulado */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg-light dark:bg-bg-dark">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <TrendingDown size={14} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-light dark:text-text-dark">Próximo pago</p>
                      <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">—</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-textMuted-light dark:text-textMuted-dark">
                    —
                  </span>
                </div>
              </div>

              <Link
                to="/deudas"
                className="mt-3 block text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Ver todas las deudas →
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            DESGLOSE DEL MES (si hay mes seleccionado)
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
```

---

## Resumen de cambios

| Cambio | Detalle |
|--------|---------|
| Iconos importados | + `Wallet`, `CreditCard`, `TrendingUp`, `TrendingDown`, `PiggyBank`, `Calendar` |
| Nuevos useMemo | `mesActualKey`, `ingresosMes`, `gastosMes` (mensuales) |
| `ahorroTotal` | alias de `balance` |
| 4 tarjetas resumen | Balance Total, Ingresos del Mes, Gastos del Mes, Ahorro Total |
| Grilla 2 columnas | Izq 3/4: gráfico + historial. Der 1/4: tarjeta crédito + próximos pagos |
| Colores | `indigo-*` → `blue-*`, `green-*` → `emerald-*`, `red-*` → `rose-*` |
| Tarjeta premium | Gradient blue-600→slate-900 con número simulado, titular, vencimiento |
| Próximos pagos | Placeholder con enlace a /deudas |
| Backend | Sin cambios en useEffect, estados, handlers, queries Supabase |
