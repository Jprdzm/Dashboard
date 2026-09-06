import db from './db';
import { syncUpsert, syncDelete } from './syncQueue';

// Shared contract between the Calendario module (CRUD UI, via useSyncData
// in CalendarioPage.jsx) and the Calificaciones module (writes exam dates
// here so they show up on the calendar). Both read/write the same
// 'calendar_events' local cache key and the same 'eventos' Supabase table.
//
// Event shape (columns match 1:1, see supabase_schema_calendario_calificaciones.sql):
// {
//   id: string,            // crypto.randomUUID() for manual events;
//                           // gradeEventId(...) for events created from the
//                           // grades module (stable id so re-saving a date
//                           // updates instead of duplicating).
//   title: string,
//   date: 'YYYY-MM-DD',
//   startTime: 'HH:MM' | null,
//   endTime: 'HH:MM' | null,
//   type: 'examen' | 'entrega' | 'clase' | 'personal',
//   materiaId: string | null,
//   description: string,
//   source: 'manual' | 'grades',
// }

const EVENTS_KEY = 'calendar_events';
const TABLE = 'eventos';

export async function getCalendarEvents() {
  const events = await db.getItem(EVENTS_KEY);
  return Array.isArray(events) ? events : [];
}

async function saveLocal(events) {
  await db.setItem(EVENTS_KEY, events);
}

// `user` is the object from useAuth() — required to push to Supabase.
// Writes to the local cache regardless, so it still works offline/logged out.
export async function upsertCalendarEvent(event, user) {
  const events = await getCalendarEvents();
  const idx = events.findIndex((e) => e.id === event.id);
  const next = idx >= 0
    ? events.map((e, i) => (i === idx ? { ...e, ...event } : e))
    : [...events, event];
  await saveLocal(next);
  if (user) await syncUpsert(TABLE, event, user);
  return next;
}

export async function removeCalendarEvent(id, user) {
  const events = await getCalendarEvents();
  const next = events.filter((e) => e.id !== id);
  await saveLocal(next);
  if (user) await syncDelete(TABLE, id, user);
  return next;
}

// userId is embedded so the id stays unique across the whole Supabase table
// (the primary key isn't scoped per-user) even when two users have the same
// materiaId + componente (e.g. both taking "angiologia" / "Parcial 1").
export function gradeEventId(materiaId, componenteSlug, userId) {
  return `grade-${userId}-${materiaId}-${componenteSlug}`;
}
