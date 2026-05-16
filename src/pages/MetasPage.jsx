import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Target, Clock, TrendingUp, Wallet } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { useEffect } from 'react';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

function daysBetween(from, to) {
  return Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
}

function progressColor(pct) {
  if (pct >= 100) return 'bg-green-500';
  if (pct >= 66) return 'bg-indigo-500';
  if (pct >= 33) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function MetasPage() {
  const { user, session } = useAuth();
  const supabaseReady = isSupabaseConfigured;

  const [goals, setGoals, isLoadingGoals] = useIndexedDB('goals', []);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quickAddAmount, setQuickAddAmount] = useState({});

  useEffect(() => {
    if (!supabaseReady || !user || isLoadingGoals) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('metas')
          .select('*')
          .eq('user_id', user.id);
        if (cancelled) return;
        if (error) {
          console.error('Error al obtener metas:', error);
        } else if (data) {
          const mapped = data.map(d => ({
            id: d.id,
            name: d.nombre || d.name,
            targetAmount: d.monto_objective || d.target_amount || d.goal_amount,
            currentAmount: d.monto_actual || d.current_amount || 0,
            deadline: d.deadline,
            contributions: [],
          }));
          setGoals(mapped);
        }
      } catch (err) {
        if (!cancelled) console.error('Error:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setGoals, isLoadingGoals]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return;

    const newGoal = {
      id: Date.now(),
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline,
      contributions: [],
    };

    setGoals((prev) => [...prev, newGoal]);

    if (supabaseReady && session?.user?.id) {
      try {
        const { error } = await supabase
          .from('metas')
          .insert([{
            nombre: newGoal.name,
            name: newGoal.name,
            monto_objective: parseFloat(targetAmount),
            target_amount: parseFloat(targetAmount),
            goal_amount: parseFloat(targetAmount),
            monto_actual: 0,
            current_amount: 0,
            deadline,
            user_id: session.user.id,
          }]);
        if (error) alert('Error al sincronizar meta: ' + error.message);
      } catch (err) {
        alert('Error al sincronizar meta: ' + err.message);
      }
    }

    setName('');
    setTargetAmount('');
    setDeadline('');
  };

  const handleDelete = async (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));

    if (supabaseReady) {
      try {
        const { error } = await supabase
          .from('metas')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) console.error('[MetasPage] Error de Supabase al eliminar meta:', error);
      } catch (err) {
        console.error('[MetasPage] Error inesperado al eliminar meta:', err);
      }
    }
  };

  const handleQuickAdd = async (id) => {
    const amt = parseFloat(quickAddAmount[id]);
    if (!amt || amt <= 0) return;

    let newAmount = 0;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        newAmount = Math.min(g.currentAmount + amt, g.targetAmount);
        return {
          ...g,
          currentAmount: newAmount,
          contributions: [
            ...g.contributions,
            { id: Date.now(), amount: amt, date: new Date().toISOString() },
          ],
        };
      }),
    );
    setQuickAddAmount((prev) => ({ ...prev, [id]: '' }));

    if (supabaseReady) {
      try {
        await supabase.from('metas').update({ monto_actual: newAmount, current_amount: newAmount }).eq('id', id);
      } catch (err) {
        console.error('Error al actualizar meta:', err);
      }
    }
  };

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
    return { totalTarget, totalCurrent, remaining: totalTarget - totalCurrent };
  }, [goals]);

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
          Metas y Apartados
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Meta Total
            </span>
            <p className="text-2xl font-bold mt-1 text-text-light dark:text-text-dark">
              {formatCurrency(stats.totalTarget)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Ahorrado
            </span>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalCurrent)}
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Por Ahorrar
            </span>
            <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
              {formatCurrency(stats.remaining)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-8">
          <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark text-sm">
            Crear Nueva Meta
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nombre (Ej. Fondo de Emergencia)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Monto Objetivo"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                Crear Meta
              </button>
            </div>
          </form>
        </div>

        {goals.length === 0 && (
          <div className="p-12 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <Target size={32} className="mx-auto mb-3 text-textMuted-light dark:text-textMuted-dark" />
            <p className="text-textMuted-light dark:text-textMuted-dark">
              No hay metas registradas. Crea tu primera meta arriba.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysLeft = daysBetween(new Date().toISOString(), goal.deadline);
            const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
            const suggestedWeekly = remaining / weeksLeft;
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            const recentContributions = goal.contributions
              .filter((c) => Date.now() - new Date(c.date).getTime() < 7 * 24 * 60 * 60 * 1000)
              .sort((a, b) => new Date(b.date) - new Date(a.date));

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20'
                    : daysLeft < 30
                      ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10'
                      : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-text-light dark:text-text-dark">
                      {goal.name}
                      {isCompleted && (
                        <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                          Completada
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-textMuted-light dark:text-textMuted-dark">
                      <span>Meta: {formatCurrency(goal.targetAmount)}</span>
                      <span>Actual: {formatCurrency(goal.currentAmount)}</span>
                      <span>Faltan {daysLeft} días</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1.5 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    aria-label="Eliminar meta"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-3 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold tabular-nums text-text-light dark:text-text-dark w-14 text-right">
                    {progress.toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-light dark:bg-bg-dark">
                    <Wallet size={14} className="text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark">Restante</span>
                      <p className="text-sm font-semibold tabular-nums text-text-light dark:text-text-dark">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-light dark:bg-bg-dark">
                    <TrendingUp size={14} className="text-green-500 shrink-0" />
                    <div>
                      <span className="text-xs text-textMuted-light dark:text-textMuted-dark">
                        {weeksLeft === 1 ? 'Por semana' : `${weeksLeft} sem. restantes`}
                      </span>
                      <p className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                        {formatCurrency(suggestedWeekly)}
                        <span className="text-xs font-normal text-textMuted-light dark:text-textMuted-dark"> /sem</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Aportar"
                      value={quickAddAmount[goal.id] || ''}
                      onChange={(e) =>
                        setQuickAddAmount((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(goal.id); }
                      }}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
                    />
                    <button
                      onClick={() => handleQuickAdd(goal.id)}
                      disabled={isCompleted}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {recentContributions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock size={12} className="text-textMuted-light dark:text-textMuted-dark" />
                      <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark">
                        Últimos 7 días
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentContributions.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-xs text-green-700 dark:text-green-300"
                        >
                          <Plus size={10} />
                          {formatCurrency(c.amount)}
                          <span className="text-green-500/70 dark:text-green-400/70">
                            {formatRelativeTime(c.date)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
