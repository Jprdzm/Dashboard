import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X, Target, TrendingUp,
  CalendarDays, Flame, Award, CheckCircle2, BarChart3, Save, RefreshCw,
} from 'lucide-react';
import useSyncData from '../hooks/useSyncData';
import { sanitizeInput } from '../utils/sanitize';
import { useToast } from '../components/Toast';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey() {
  return dateKey(new Date());
}

function getWeekDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i);
    return dateKey(d);
  });
}

function getMonthDays(year, month) {
  const days = [];
  const last = new Date(year, month + 1, 0);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(dateKey(new Date(year, month, d)));
  }
  return days;
}

function streakToToday(habit) {
  let count = 0;
  const d = new Date();
  while (true) {
    if (habit.logs.includes(dateKey(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return count;
}

function monthlyCompletions(habit, year, month) {
  const days = getMonthDays(year, month);
  return days.filter((d) => habit.logs.includes(d)).length;
}

export default function HabitsPage() {
  const {
    data: habits,
    syncing,
    lastSync,
    upsert,
    remove,
  } = useSyncData('habits', 'habits', []);
  const addToast = useToast();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [view, setView] = useState('week');
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  const today = todayKey();
  const weekDays = getWeekDays();
  const monthDays = useMemo(() => getMonthDays(calYear, calMonth), [calYear, calMonth]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = sanitizeInput(newName);
    if (!trimmed) { addToast('Escribe un nombre para el hábito', 'warning'); return; }
    if (habits.some((h) => h.name.toLowerCase() === trimmed.toLowerCase())) {
      addToast('Ya existe un hábito con ese nombre', 'warning');
      return;
    }
    const newId = crypto.randomUUID();
    await upsert({ id: newId, name: trimmed, logs: [] });
    setNewName('');
    addToast('Hábito creado', 'success');
  };

  const handleDelete = async (id) => {
    await remove(id);
    if (editingId === id) setEditingId(null);
    addToast('Hábito eliminado', 'success');
  };

  const startEdit = (habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
  };

  const commitEdit = async () => {
    const trimmed = sanitizeInput(editName);
    if (!trimmed) { addToast('El nombre no puede estar vacío', 'warning'); return; }
    if (habits.some((h) => h.name.toLowerCase() === trimmed.toLowerCase() && h.id !== editingId)) {
      addToast('Ya existe un hábito con ese nombre', 'warning');
      return;
    }
    const target = habits.find((h) => h.id === editingId);
    if (target) await upsert({ ...target, name: trimmed });
    setEditingId(null);
    addToast('Hábito actualizado', 'success');
  };

  const toggleDay = async (habitId, dayKey) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const has = habit.logs.includes(dayKey);
    await upsert({
      ...habit,
      logs: has ? habit.logs.filter((k) => k !== dayKey) : [...habit.logs, dayKey],
    });
  };

  const stats = useMemo(() => {
    const total = habits.length;
    const active = habits.length;
    const doneToday = habits.filter((h) => h.logs.includes(today)).length;
    const globalStreak = habits.reduce((max, h) => Math.max(max, streakToToday(h)), 0);
    const totalLogs = habits.reduce((s, h) => s + h.logs.length, 0);
    const thisWeek = habits.reduce((s, h) => s + weekDays.filter((d) => h.logs.includes(d)).length, 0);
    const weeklyGoal = habits.length * 7;
    const weeklyRate = weeklyGoal > 0 ? Math.round((thisWeek / weeklyGoal) * 100) : 0;

    const bestHabit = habits.reduce((best, h) => {
      const s = streakToToday(h);
      return s > (best?.streak || 0) ? { name: h.name, streak: s } : best;
    }, null);

    return { total, active, doneToday, globalStreak, totalLogs, thisWeek, weeklyRate, bestHabit };
  }, [habits, today, weekDays]);

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-light dark:text-text-dark flex items-center gap-3">
              <Target size={28} className="text-indigo-500" />
              Hábitos
            </h1>
            {syncing && (
              <RefreshCw size={14} className="animate-spin text-textMuted-light dark:text-textMuted-dark" />
            )}
            {lastSync && !syncing && (
              <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
                {new Date(lastSync).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'week' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark'}`}
            >
              Mes
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════
            STATS CARDS
           ════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <BarChart3 size={16} className="mx-auto mb-1.5 text-indigo-500" />
            <p className="text-xl font-bold text-text-light dark:text-text-dark tabular-nums">{stats.active}</p>
            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Hábitos</p>
          </div>
          <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <CheckCircle2 size={16} className="mx-auto mb-1.5 text-emerald-500" />
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.doneToday}/{stats.total}</p>
            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Hoy</p>
          </div>
          <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <Flame size={16} className="mx-auto mb-1.5 text-orange-500" />
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">{stats.globalStreak}</p>
            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Mejor racha</p>
          </div>
          <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <TrendingUp size={16} className="mx-auto mb-1.5 text-green-500" />
            <p className="text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">{stats.weeklyRate}%</p>
            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Semanal</p>
          </div>
          <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <CalendarDays size={16} className="mx-auto mb-1.5 text-blue-500" />
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{stats.totalLogs}</p>
            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Total logs</p>
          </div>
          <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <Award size={16} className="mx-auto mb-1.5 text-yellow-500" />
            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400 truncate" title={stats.bestHabit?.name}>
              {stats.bestHabit ? stats.bestHabit.name : '—'}
            </p>
            <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">
              {stats.bestHabit ? `Racha: ${stats.bestHabit.streak}` : 'Top hábito'}
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════
            DETALLE SEMANAL
           ════════════════════════════════════════ */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">Progreso de esta semana</h2>
          </div>
          <div className="flex items-end justify-between gap-2 h-24">
            {weekDays.map((day, i) => {
              const doneCount = habits.filter((h) => h.logs.includes(day)).length;
              const total = habits.length;
              const pct = total > 0 ? (doneCount / total) * 100 : 0;
              const isToday = day === today;
              return (
                <div key={day} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                  <div className="w-full flex justify-center">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doneCount}/{total}
                    </span>
                  </div>
                  <div className="w-full max-w-[32px] h-full bg-slate-100 dark:bg-slate-800 rounded-t-md overflow-hidden relative flex items-end">
                    <div 
                      className={`w-full transition-all duration-700 ease-out rounded-t-md ${isToday ? 'bg-indigo-500' : 'bg-indigo-400 dark:bg-indigo-600'}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                    {DAYS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════
            ADD HABIT FORM
           ════════════════════════════════════════ */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Nuevo hábito..."
              value={newName}
              maxLength={100}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} />
              Agregar
            </button>
          </form>
        </div>

        {/* ════════════════════════════════════════
            HABITS TABLE
           ════════════════════════════════════════ */}
        {habits.length === 0 ? (
          <div className="p-12 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md text-center">
            <Target size={32} className="mx-auto mb-3 text-textMuted-light dark:text-textMuted-dark" />
            <p className="text-textMuted-light dark:text-textMuted-dark">
              No hay hábitos registrados. Crea tu primer hábito arriba.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark bg-bg-light/50 dark:bg-bg-dark/50">
                  <th className="text-left py-3 pl-4 pr-3 font-medium text-textMuted-light dark:text-textMuted-dark w-[40%]">Hábito</th>
                  {view === 'week' ? (
                    weekDays.map((day, i) => (
                      <th
                        key={day}
                        className={`py-3 px-1.5 text-center font-medium w-8 ${
                          day === today ? 'text-indigo-600 dark:text-indigo-400' : 'text-textMuted-light dark:text-textMuted-dark'
                        }`}
                      >
                        {DAYS[i]}
                      </th>
                    ))
                  ) : (
                    <th className="py-3 px-1.5 text-center font-medium text-textMuted-light dark:text-textMuted-dark w-8">
                      {MONTHS[calMonth]}
                    </th>
                  )}
                  <th className="py-3 px-2 text-right font-medium text-textMuted-light dark:text-textMuted-dark w-12">Racha</th>
                  <th className="py-3 px-2 text-right font-medium text-textMuted-light dark:text-textMuted-dark w-12">%</th>
                  <th className="py-3 pr-3 pl-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => {
                  const isEditing = editingId === habit.id;
                  const s = streakToToday(habit);
                  const monthCompletions = view === 'month' ? monthlyCompletions(habit, calYear, calMonth) : 0;
                  const monthTotal = view === 'month' ? monthDays.length : 0;
                  const pct = view === 'month'
                    ? Math.round((monthCompletions / monthTotal) * 100)
                    : Math.round((weekDays.filter((d) => habit.logs.includes(d)).length / 7) * 100);

                  return (
                    <tr key={habit.id} className="border-b border-border-light dark:border-border-dark hover:bg-bg-light/30 dark:hover:bg-bg-dark/30 transition-colors">
                      <td className="py-2.5 pl-4 pr-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editName}
                              maxLength={100}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                              className="flex-1 px-2 py-1 text-xs rounded border border-indigo-400 dark:border-indigo-500 bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                              autoFocus
                            />
                            <button onClick={commitEdit} className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                              <Save size={13} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 rounded text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-text-light dark:text-text-dark font-medium">{habit.name}</span>
                        )}
                      </td>

                      {view === 'week' ? (
                        weekDays.map((day) => {
                          const checked = habit.logs.includes(day);
                          return (
                            <td key={day} className="py-2.5 px-1.5 text-center">
                              <button
                                onClick={() => toggleDay(habit.id, day)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                                  checked
                                    ? 'bg-emerald-500 text-white'
                                    : day === today
                                      ? 'bg-slate-100 dark:bg-slate-800 text-textMuted-light dark:text-textMuted-dark hover:bg-slate-200 dark:hover:bg-slate-700'
                                      : 'bg-transparent text-textMuted-light/30 dark:text-textMuted-dark/30'
                                }`}
                              >
                                {checked && <Check size={12} strokeWidth={3} />}
                              </button>
                            </td>
                          );
                        })
                      ) : (
                        <td className="py-2.5 px-1.5 text-center">
                          <span className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                            {monthCompletions}
                          </span>
                          <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">/{monthTotal}</span>
                        </td>
                      )}

                      <td className="py-2.5 px-2 text-right font-bold tabular-nums text-orange-600 dark:text-orange-400">
                        {s}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium tabular-nums text-textMuted-light dark:text-textMuted-dark w-7 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 pl-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(habit)}
                            className="p-1 rounded text-textMuted-light dark:text-textMuted-dark hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="p-1 rounded text-textMuted-light dark:text-textMuted-dark hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            title="Eliminar"
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

        {/* ════════════════════════════════════════
            MONTH NAVIGATION
           ════════════════════════════════════════ */}
        {view === 'month' && habits.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handlePrevMonth}
              className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
            >
              ← {MONTHS[calMonth === 0 ? 11 : calMonth - 1]}
            </button>
            <span className="text-sm font-semibold text-text-light dark:text-text-dark">
              {MONTHS[calMonth]} {calYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
            >
              {MONTHS[calMonth === 11 ? 0 : calMonth + 1]} →
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            MONTHLY HEATMAP
           ════════════════════════════════════════ */}
        {view === 'month' && habits.length > 0 && (
          <div className="mt-8 p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md">
            <h2 className="font-semibold text-text-light dark:text-text-dark text-sm mb-4 flex items-center gap-2">
              <CalendarDays size={14} className="text-blue-500" />
              Resumen Mensual — {MONTHS[calMonth]} {calYear}
            </h2>
            <div className="grid grid-cols-7 gap-1.5">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-textMuted-light dark:text-textMuted-dark py-1">
                  {d}
                </div>
              ))}
              {/* Empty cells for first day offset */}
              {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map((day) => {
                const doneCount = habits.filter((h) => h.logs.includes(day)).length;
                const total = habits.length;
                const intensity = total > 0 ? doneCount / total : 0;
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all ${
                      isToday ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''
                    } ${
                      intensity === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-textMuted-light/50 dark:text-textMuted-dark/50'
                        : intensity <= 0.33
                          ? 'bg-indigo-200 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                          : intensity <= 0.66
                            ? 'bg-indigo-400 dark:bg-indigo-700 text-white'
                            : 'bg-indigo-600 dark:bg-indigo-500 text-white'
                    }`}
                    title={`${day}: ${doneCount}/${total}`}
                  >
                    {new Date(day).getDate()}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Menos</span>
              <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-900/40" />
              <div className="w-3 h-3 rounded bg-indigo-400 dark:bg-indigo-700" />
              <div className="w-3 h-3 rounded bg-indigo-600 dark:bg-indigo-500" />
              <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Más</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
