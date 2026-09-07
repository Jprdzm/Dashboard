import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import useSyncData from '../hooks/useSyncData';
import { EVENT_TYPES } from '../utils/calendarEventTypes';
import { todayISO, daysUntil, parseISODate } from '../utils/calendarDate';

function typeMeta(type) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
}

function relativeLabel(days) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

function fmtEventDate(iso) {
  const d = parseISODate(iso);
  if (!d) return '';
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function UpcomingEventsWidget() {
  const { data: events, isLoading } = useSyncData('eventos', 'calendar_events', []);
  const safeEvents = Array.isArray(events) ? events : [];
  const today = todayISO();

  const upcoming = safeEvents
    .filter((ev) => ev && ev.date && ev.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
    .slice(0, 5);

  return (
    <div className="p-5 rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:scale-[1.015] hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-all duration-300 ease-soft-out flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-accent-light dark:bg-accent-dark flex items-center justify-center shadow-sm shrink-0">
          <CalendarDays size={16} className="text-white" />
        </div>
        <h2 className="font-heading font-semibold text-text-light dark:text-text-dark text-sm">Próximos eventos</h2>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-4 h-4 rounded-full border-2 border-neutral-500 border-t-transparent animate-spin" />
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-1">
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark">No hay eventos próximos</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((ev) => {
            const meta = typeMeta(ev.type);
            const days = daysUntil(ev.date);
            return (
              <li
                key={ev.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-bg-light/60 dark:bg-bg-dark/40 border border-border-light dark:border-border-dark"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-light dark:text-text-dark truncate">
                    {ev.title || 'Sin título'}
                  </p>
                  <p className={`text-[11px] ${meta.text}`}>{meta.label}</p>
                </div>
                <span className="text-[11px] font-semibold text-textMuted-light dark:text-textMuted-dark shrink-0 tabular-nums">
                  {Number.isFinite(days) && days <= 1 ? relativeLabel(days) : fmtEventDate(ev.date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/calendario"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
      >
        Ver calendario completo <ArrowRight size={13} />
      </Link>
    </div>
  );
}
