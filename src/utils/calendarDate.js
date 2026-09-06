// Pure date helpers for the Calendario module. No external dependencies —
// everything here works off the native Date object. All helpers treat dates
// as LOCAL calendar days (never UTC) to avoid off-by-one bugs around
// timezones when parsing/formatting 'YYYY-MM-DD' strings.

const DAY_MS = 24 * 60 * 60 * 1000;

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Weeks are rendered Monday → Sunday.
export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Formats a Date as a local 'YYYY-MM-DD' string (no UTC conversion). */
export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parses a 'YYYY-MM-DD' string into a local Date at midnight. Returns null if invalid. */
export function parseISODate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isTodayISO(iso) {
  const d = parseISODate(iso);
  return d ? isSameDay(d, new Date()) : false;
}

/**
 * Days from today until `iso`. 0 = today, positive = future, negative = past.
 * Used for the "Examen próximo" badge (type === 'examen' with 0 <= daysUntil <= 7).
 */
export function daysUntil(iso) {
  const target = parseISODate(iso);
  if (!target) return NaN;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - todayMidnight) / DAY_MS);
}

/** Monday-based weekday index: 0 = Monday ... 6 = Sunday. */
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - mondayIndex(d));
  return d;
}

export function addDays(date, amount) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + amount);
  return d;
}

/** Returns the first day of the month `amount` months away from `date`. */
export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addWeeks(date, amount) {
  return addDays(date, amount * 7);
}

/**
 * Builds a month grid (weeks x 7 days) including the trailing days of the
 * previous/next month needed to complete full Monday-Sunday weeks. Returns
 * 4-6 weeks depending on how the month falls on the calendar.
 */
export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const gridStart = startOfWeek(firstOfMonth);
  const gridEnd = startOfWeek(lastOfMonth);

  const weeks = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: cursor,
        iso: toISODate(cursor),
        isCurrentMonth: cursor.getMonth() === month,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Builds the 7 days (Mon-Sun) of the week containing `date`. */
export function getWeekGrid(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { date: d, iso: toISODate(d), isCurrentMonth: true };
  });
}

export function getMonthLabel(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function getWeekRangeLabel(date) {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const startLabel = `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)}`;
  const endLabel = `${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
  return `${startLabel} - ${endLabel}`;
}
