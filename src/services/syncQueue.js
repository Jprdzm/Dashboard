import db from './db';
import supabase, { isSupabaseConfigured } from './supabaseClient';
import { enrichWithUser } from './withUser';

const QUEUE_KEY = 'sync_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];

let processing = false;
let listeners = [];

export function onOnlineStatusChange(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

function notify(status) {
  listeners.forEach((fn) => fn(status));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notify(true));
  window.addEventListener('offline', () => notify(false));
}

export function isOnline() {
  return navigator.onLine;
}

async function getQueue() {
  const queue = await db.getItem(QUEUE_KEY);
  return queue || [];
}

async function saveQueue(queue) {
  await db.setItem(QUEUE_KEY, queue);
}

export async function enqueue(operation) {
  const queue = await getQueue();
  queue.push({
    id: crypto.randomUUID(),
    ...operation,
    retries: 0,
    createdAt: Date.now(),
  });
  await saveQueue(queue);
  if (isOnline()) processQueue();
}

export async function processQueue() {
  if (processing || !isOnline()) return;
  processing = true;

  try {
    const queue = await getQueue();
    if (queue.length === 0) { processing = false; return; }

    for (const item of queue) {
      try {
        await executeOperation(item);
        await removeFromQueue(item.id);
      } catch {
        item.retries++;
        if (item.retries >= MAX_RETRIES) {
          await removeFromQueue(item.id);
        } else {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[Math.min(item.retries - 1, RETRY_DELAYS.length - 1)]));
        }
      }
    }
  } finally {
    processing = false;
  }
}

async function removeFromQueue(id) {
  const queue = await getQueue();
  await saveQueue(queue.filter((q) => q.id !== id));
}

async function executeOperation(item) {
  const { table, action, data, userId } = item;
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');

  const userObj = { id: userId };
  const enriched = enrichWithUser(data, userObj);

  switch (action) {
    case 'insert': {
      const { error } = await supabase.from(table).insert([enriched]);
      if (error) throw error;
      break;
    }
    case 'upsert': {
      const { error } = await supabase.from(table).upsert(enriched, { onConflict: 'id' });
      if (error) throw error;
      break;
    }
    case 'update': {
      const { error } = await supabase.from(table).update(enriched).eq('id', data.id).eq('user_id', userId);
      if (error) throw error;
      break;
    }
    case 'delete': {
      const { error } = await supabase.from(table).delete().eq('id', data.id).eq('user_id', userId);
      if (error) throw error;
      break;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

processQueue();
if (isOnline()) processQueue();

export async function syncUpsert(table, data, user) {
  if (!isSupabaseConfigured || !supabase || !user) {
    await enqueue({ table, action: 'upsert', data, userId: user?.id });
    return null;
  }
  try {
    const enriched = enrichWithUser(data, user);
    const { error } = await supabase.from(table).upsert(enriched, { onConflict: 'id' });
    if (error) throw error;
    } catch {
      await enqueue({ table, action: 'upsert', data, userId: user.id });
    }
  }

export async function syncDelete(table, id, user) {
  if (!isSupabaseConfigured || !supabase || !user) {
    await enqueue({ table, action: 'delete', data: { id }, userId: user?.id });
    return;
  }
  try {
    const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    } catch {
      await enqueue({ table, action: 'delete', data: { id }, userId: user.id });
    }
  }

export async function fetchWithCache(table, user, cacheKey, setData) {
  if (!isSupabaseConfigured || !supabase || !user) {
    const cached = await db.getItem(cacheKey);
    if (cached) setData(cached);
    return;
  }

  try {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
    if (error) throw error;
    if (data) {
      await db.setItem(cacheKey, data);
      setData(data);
    }
    } catch {
      const cached = await db.getItem(cacheKey);
      if (cached) setData(cached);
    }
  }

export async function subscribeToTable(table, user, onData) {
  if (!isSupabaseConfigured || !supabase || !user) return null;

  const channel = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
      async () => {
        const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
        if (!error && data) onData(data);
      },
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => processQueue());
  const interval = setInterval(() => { if (isOnline()) processQueue(); }, 30000);
  if (typeof window !== 'undefined') window.addEventListener('beforeunload', () => clearInterval(interval));
}
