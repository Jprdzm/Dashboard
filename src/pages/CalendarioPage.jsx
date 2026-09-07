import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, AlertCircle, CalendarClock, Check, ListTodo } from 'lucide-react';
import useSyncData from '../hooks/useSyncData';
import { useToast } from '../components/Toast';
import CalendarEventForm from '../components/CalendarEventForm';
import { EVENT_TYPES } from '../utils/calendarEventTypes';
import {
  MONTH_NAMES, WEEKDAY_LABELS,
  todayISO, isTodayISO, daysUntil,
  addMonths, addWeeks,
  getMonthGrid, getWeekGrid, getMonthLabel, getWeekRangeLabel,
} from '../utils/calendarDate';

const LOCALE = 'es-MX';

// NOTE on the weekly view: it's a real, usable view (not a stub) — it reuses
// the same day-cell rendering primitives as the monthly grid, just laid out
// as a single row with more vertical room per day. A full "time grid" (hour
// rows with events positioned by time, drag-to-resize, etc.) was left out on
// purpose: it would require a lot of extra layout logic for a personal
// calendar that mostly has 0-3 events/day, and risked making the view feel
// unfinished. This simpler agenda-style week view stays solid instead.

function typeMeta(type) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
}

function EventChip({ event, onClick, onToggleComplete, compact }) {
  const meta = typeMeta(event.type);
  const isTask = event.type === 'tarea';
  const isDone = isTask && event.completed;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      title={event.title}
      className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate text-left transition-colors ${meta.chip} ${compact ? '' : 'py-1'}`}
    >
      {isTask && (
        <span
          role="checkbox"
          aria-checked={isDone}
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onToggleComplete(event); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onToggleComplete(event);
            }
          }}
          className={`shrink-0 flex items-center justify-center w-3 h-3 rounded-sm border cursor-pointer ${
            isDone
              ? 'bg-lime-600 border-lime-600 dark:bg-lime-500 dark:border-lime-500'
              : 'border-current opacity-60 hover:opacity-100'
          }`}
        >
          {isDone && <Check size={9} strokeWidth={3} className="text-white" />}
        </span>
      )}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
      {event.startTime && <span className="shrink-0 tabular-nums opacity-80">{event.startTime}</span>}
      <span className={`truncate ${isDone ? 'line-through opacity-60' : ''}`}>{event.title}</span>
    </button>
  );
}

export default function CalendarioPage() {
  const { data: events, upsert, remove, isLoading } = useSyncData('eventos', 'calendar_events', []);
  const addToast = useToast();

  const [cursor, setCursor] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [formState, setFormState] = useState(null); // { event, date } | null

  const safeEvents = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    for (const ev of safeEvents) {
      if (!ev || !ev.date) continue;
      if (!map.has(ev.date)) map.set(ev.date, []);
      map.get(ev.date).push(ev);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }
    return map;
  }, [safeEvents]);

  const upcomingExam = useMemo(() => {
    return safeEvents
      .filter((ev) => ev && ev.type === 'examen')
      .map((ev) => ({ ev, days: daysUntil(ev.date) }))
      .filter(({ days }) => Number.isFinite(days) && days >= 0 && days <= 7)
      .sort((a, b) => a.days - b.days)[0];
  }, [safeEvents]);

  const upcomingCita = useMemo(() => {
    return safeEvents
      .filter((ev) => ev && ev.type === 'cita')
      .map((ev) => ({ ev, days: daysUntil(ev.date) }))
      .filter(({ days }) => Number.isFinite(days) && days >= 0 && days <= 7)
      .sort((a, b) => a.days - b.days)[0];
  }, [safeEvents]);

  const pendingTasks = useMemo(() => {
    const today = todayISO();
    const pending = safeEvents.filter((ev) => ev && ev.type === 'tarea' && !ev.completed);
    const overdue = pending.filter((ev) => ev.date < today);
    return { total: pending.length, overdue: overdue.length };
  }, [safeEvents]);

  const grid = viewMode === 'month'
    ? getMonthGrid(cursor.getFullYear(), cursor.getMonth())
    : [getWeekGrid(cursor)];

  const headerLabel = viewMode === 'month' ? getMonthLabel(cursor) : getWeekRangeLabel(cursor);

  const goPrev = () => setCursor((d) => (viewMode === 'month' ? addMonths(d, -1) : addWeeks(d, -1)));
  const goNext = () => setCursor((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)));
  const goToday = () => setCursor(new Date());

  const openCreate = (iso) => setFormState({ event: null, date: iso });
  const openEdit = (event) => setFormState({ event, date: event.date });
  const closeForm = () => setFormState(null);

  const handleSave = async (data) => {
    if (formState?.event) {
      await upsert({ ...formState.event, ...data });
      addToast('Evento actualizado', 'success');
    } else {
      await upsert({ id: crypto.randomUUID(), source: 'manual', ...data });
      addToast('Evento creado', 'success');
    }
    closeForm();
  };

  const handleToggleTask = async (event) => {
    await upsert({ ...event, completed: !event.completed });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este evento?')) return;
    await remove(id);
    addToast('Evento eliminado', 'success');
    closeForm();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-neutral-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays size={22} className="text-neutral-900 dark:text-neutral-100" />
              Calendario
            </h1>
            <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-0.5">
              {new Date().toLocaleDateString(LOCALE, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => openCreate(todayISO())}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 active:scale-[0.98] text-white dark:text-neutral-900 text-sm font-semibold transition-colors duration-200 ease-soft-out"
          >
            <Plus size={15} />
            Nuevo evento
          </button>
        </div>

        {/* Upcoming exam / cita badges + tareas pendientes summary */}
        {(upcomingExam || upcomingCita || pendingTasks.total > 0) && (
          <div className="flex flex-col gap-2 mb-6">
            {upcomingExam && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  <strong>Examen próximo:</strong> {upcomingExam.ev.title} —{' '}
                  {upcomingExam.days === 0 ? 'hoy' : upcomingExam.days === 1 ? 'mañana' : `en ${upcomingExam.days} días`}
                </span>
              </div>
            )}
            {upcomingCita && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  <strong>Cita próxima:</strong> {upcomingCita.ev.title} —{' '}
                  {upcomingCita.days === 0 ? 'hoy' : upcomingCita.days === 1 ? 'mañana' : `en ${upcomingCita.days} días`}
                </span>
              </div>
            )}
            {pendingTasks.total > 0 && (
              <div className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg border border-lime-200 dark:border-lime-900/40 bg-lime-50/70 dark:bg-lime-950/20 text-lime-700 dark:text-lime-300 text-xs font-medium">
                <ListTodo size={13} className="shrink-0" />
                <span>
                  {pendingTasks.total} pendiente{pendingTasks.total === 1 ? '' : 's'}
                  {pendingTasks.overdue > 0 && (
                    <>
                      {' '}(<span className="text-rose-600 dark:text-rose-400">{pendingTasks.overdue} vencida{pendingTasks.overdue === 1 ? '' : 's'}</span>)
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-2 rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-200 ease-soft-out"
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[10rem] text-center text-sm font-semibold capitalize">
              {headerLabel}
            </span>
            <button
              onClick={goNext}
              className="p-2 rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-200 ease-soft-out"
              aria-label="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-95 transition-all duration-200 ease-soft-out"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-white/[0.04] rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ease-soft-out ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-white/[0.1] text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-textMuted-light dark:text-textMuted-dark'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ease-soft-out ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-white/[0.1] text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-textMuted-light dark:text-textMuted-dark'
              }`}
            >
              Semana
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {EVENT_TYPES.map((t) => (
            <span key={t.value} className="flex items-center gap-1.5 text-[11px] text-textMuted-light dark:text-textMuted-dark">
              <span className={`w-2 h-2 rounded-full ${t.dot}`} />
              {t.label}
            </span>
          ))}
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-[11px] font-semibold text-textMuted-light dark:text-textMuted-dark py-1">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-1.5">
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((day) => {
                const dayEvents = eventsByDate.get(day.iso) || [];
                const isToday = isTodayISO(day.iso);
                const visibleEvents = viewMode === 'month' ? dayEvents.slice(0, 3) : dayEvents;
                const extra = viewMode === 'month' ? dayEvents.length - visibleEvents.length : 0;

                return (
                  <div
                    key={day.iso}
                    onClick={() => openCreate(day.iso)}
                    className={`group relative flex flex-col p-1.5 rounded-xl border cursor-pointer transition-all duration-200 ease-soft-out ${
                      viewMode === 'month' ? 'min-h-[6.5rem]' : 'min-h-[16rem]'
                    } ${
                      isToday
                        ? 'border-neutral-400 dark:border-neutral-500 bg-neutral-100/60 dark:bg-neutral-800/30'
                        : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md hover:border-neutral-300 dark:hover:border-neutral-700/50 hover:shadow-soft-sm dark:hover:shadow-soft-dark-sm'
                    } ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isToday ? 'text-neutral-900 dark:text-neutral-100' : 'text-text-light dark:text-text-dark'}`}>
                        {day.date.getDate()}
                        {viewMode === 'week' && (
                          <span className="ml-1 font-normal text-textMuted-light dark:text-textMuted-dark">
                            {MONTH_NAMES[day.date.getMonth()].slice(0, 3)}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreate(day.iso); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-textMuted-light dark:text-textMuted-dark hover:text-neutral-700 dark:hover:text-neutral-300 active:scale-90 transition-all duration-200 ease-soft-out"
                        aria-label="Agregar evento"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1 overflow-hidden">
                      {visibleEvents.map((ev) => (
                        <EventChip key={ev.id} event={ev} onClick={openEdit} onToggleComplete={handleToggleTask} compact={viewMode === 'month'} />
                      ))}
                      {extra > 0 && (
                        <span className="text-[10px] text-textMuted-light dark:text-textMuted-dark pl-1">
                          +{extra} más
                        </span>
                      )}
                      {viewMode === 'week' && dayEvents.length === 0 && (
                        <p className="text-[10px] text-textMuted-light/60 dark:text-textMuted-dark/60 italic">Sin eventos</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {safeEvents.length === 0 && (
          <div className="mt-6 p-8 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm text-center">
            <CalendarClock size={28} className="mx-auto mb-3 text-textMuted-light dark:text-textMuted-dark" />
            <p className="text-sm text-textMuted-light dark:text-textMuted-dark">
              No hay eventos todavía. Haz clic en un día o en "Nuevo evento" para crear el primero.
            </p>
          </div>
        )}
      </div>

      {formState && (
        <CalendarEventForm
          event={formState.event}
          defaultDate={formState.date}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
