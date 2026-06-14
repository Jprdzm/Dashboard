import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, BarChart3 } from 'lucide-react';
import useSyncData from '../hooks/useSyncData';
import { GridList, GridListItem } from './ui/grid-list';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function streakToToday(habit) {
  let count = 0;
  const d = new Date();
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (habit.logs.includes(key)) {
      count++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return count;
}

export default function HabitTracker() {
  const { data: habits, upsert } = useSyncData('habits', 'habits', []);
  const today = todayKey();

  const toggleToday = async (habitId) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const has = habit.logs.includes(today);
    await upsert({
      ...habit,
      logs: has ? habit.logs.filter((k) => k !== today) : [...habit.logs, today],
    });
  };

  const stats = useMemo(() => {
    const total = habits.length;
    const doneToday = habits.filter((h) => h.logs.includes(today)).length;
    const completionRate = total > 0 ? Math.round((doneToday / total) * 100) : 0;
    const bestStreak = habits.reduce((max, h) => Math.max(max, streakToToday(h)), 0);
    return { total, doneToday, completionRate, bestStreak };
  }, [habits, today]);

  const sortedHabits = useMemo(
    () =>
      [...habits].sort((a, b) => {
        const aDone = a.logs.includes(today);
        const bDone = b.logs.includes(today);
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      }),
    [habits, today]
  );

  const doneKeys = useMemo(
    () => new Set(habits.filter((h) => h.logs.includes(today)).map((h) => h.id)),
    [habits, today]
  );

  const handleSelectionChange = (newKeys) => {
    if (newKeys === 'all') return;
    const newKeysSet = new Set(newKeys);
    for (const id of newKeysSet) {
      if (!doneKeys.has(id)) toggleToday(id);
    }
    for (const id of doneKeys) {
      if (!newKeysSet.has(id)) toggleToday(id);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text-light dark:text-text-dark text-sm flex items-center gap-2">
          <Target size={15} className="text-teal-500" />
          Hábitos de Hoy
        </h2>
        <Link
          to="/habits"
          className="text-[10px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1"
        >
          <BarChart3 size={12} />
          Ver todo
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 text-center p-2 rounded-lg bg-bg-light dark:bg-bg-dark">
          <p className="text-lg font-bold text-text-light dark:text-text-dark tabular-nums">{stats.completionRate}%</p>
          <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Hoy</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg bg-bg-light dark:bg-bg-dark">
          <p className="text-lg font-bold text-teal-600 dark:text-teal-400 tabular-nums">
            {stats.doneToday}/{stats.total}
          </p>
          <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Completados</p>
        </div>
        <div className="flex-1 text-center p-2 rounded-lg bg-bg-light dark:bg-bg-dark">
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{stats.bestStreak}</p>
          <p className="text-[10px] text-textMuted-light dark:text-textMuted-dark">Mejor racha</p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-4">
          <TrendingUp size={24} className="mx-auto mb-2 text-textMuted-light dark:text-textMuted-dark" />
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark mb-2">
            No hay hábitos todavía
          </p>
          <Link
            to="/habits"
            className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            Crear hábitos →
          </Link>
        </div>
      ) : (
        <GridList
          aria-label="Hábitos de hoy"
          selectionMode="multiple"
          selectionBehavior="toggle"
          selectedKeys={doneKeys}
          onSelectionChange={handleSelectionChange}
        >
          {sortedHabits.map((habit) => {
            const done = habit.logs.includes(today);
            const streak = streakToToday(habit);
            return (
              <GridListItem key={habit.id} id={habit.id}>
                <span
                  className={`flex-1 text-sm transition-all ${
                    done
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-text-light dark:text-text-dark'
                  }`}
                >
                  {habit.name}
                </span>
                {streak > 0 && (
                  <span className="text-[10px] font-semibold tabular-nums text-teal-600 dark:text-teal-400">
                    {streak}d
                  </span>
                )}
              </GridListItem>
            );
          })}
        </GridList>
      )}
    </div>
  );
}
