import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, ArrowRight } from 'lucide-react';
import useSyncData from '../hooks/useSyncData';
import { daysUntil, parseISODate } from '../utils/calendarDate';

function fmtDueDate(iso) {
  const d = parseISODate(iso);
  if (!d) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function dueLabel(days) {
  if (!Number.isFinite(days)) return '';
  if (days < 0) return `Atrasada ${Math.abs(days)}d`;
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

// Same table/cache key as CalendarioPage.jsx ('eventos' / 'calendar_events') —
// pending tasks are just calendar events with type 'tarea' and completed:false.
// Toggling here uses the exact same upsert shape as handleToggleTask there.
export default function PendingTasksWidget() {
  const { data: events, isLoading, upsert } = useSyncData('eventos', 'calendar_events', []);

  const pending = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    return safeEvents
      .filter((ev) => ev && ev.type === 'tarea' && !ev.completed && ev.date)
      .map((ev) => ({ ev, days: daysUntil(ev.date) }))
      .sort((a, b) => a.ev.date.localeCompare(b.ev.date))
      .slice(0, 6);
  }, [events]);

  const overdueCount = pending.filter((p) => p.days < 0).length;

  const handleComplete = async (ev) => {
    await upsert({ ...ev, completed: true });
  };

  return (
    <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-all duration-300 ease-soft-out flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center shadow-sm shrink-0">
          <ListTodo size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">Pendientes</h2>
        </div>
        {overdueCount > 0 && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/25 text-rose-600 dark:text-rose-400 shrink-0">
            {overdueCount} atrasada{overdueCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-4 h-4 rounded-full border-2 border-lime-500 border-t-transparent animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-1">
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark">Sin tareas pendientes 🎉</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {pending.map(({ ev, days }) => (
            <li
              key={ev.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-bg-light/60 dark:bg-bg-dark/40 border border-border-light dark:border-border-dark"
            >
              <button
                onClick={() => handleComplete(ev)}
                aria-label={`Marcar "${ev.title}" como completada`}
                title="Marcar como completada"
                className="shrink-0 w-4 h-4 rounded-sm border border-lime-500/60 dark:border-lime-400/50 hover:bg-lime-50 dark:hover:bg-lime-900/20 active:scale-90 transition-all duration-150 ease-soft-out"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">
                  {ev.title || 'Sin título'}
                </p>
              </div>
              <span className={`text-[11px] font-semibold shrink-0 tabular-nums ${days < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                {dueLabel(days) || fmtDueDate(ev.date)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/calendario"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 transition-colors"
      >
        Ver todas <ArrowRight size={13} />
      </Link>
    </div>
  );
}
