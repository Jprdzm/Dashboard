// Shared event-type styling/metadata for the Calendario module. Kept in its
// own file (rather than inside CalendarEventForm.jsx) so both the form and
// CalendarioPage.jsx can import it without tripping the
// react-refresh/only-export-components lint rule, which requires component
// files to export only components.
export const EVENT_TYPES = [
  { value: 'examen', label: 'Examen', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', chip: 'bg-rose-500/12 text-rose-700 dark:text-rose-300 dark:bg-rose-500/15' },
  { value: 'entrega', label: 'Entrega', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', chip: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 dark:bg-amber-500/15' },
  { value: 'clase', label: 'Clase', dot: 'bg-slate-600 dark:bg-slate-400', text: 'text-slate-700 dark:text-slate-300', chip: 'bg-slate-500/12 text-slate-700 dark:text-slate-300 dark:bg-slate-500/15' },
  { value: 'personal', label: 'Personal', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/15' },
  { value: 'cita', label: 'Cita', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', chip: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 dark:bg-sky-500/15' },
  { value: 'tarea', label: 'Tarea', dot: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400', chip: 'bg-lime-500/12 text-lime-700 dark:text-lime-300 dark:bg-lime-500/15' },
];

export const EVENT_TYPE_VALUES = EVENT_TYPES.map((t) => t.value);
