import { useState, useEffect, useCallback, useRef } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { fetchWithCache, syncUpsert, syncDelete, subscribeToTable } from '../services/syncQueue';

export default function useSyncData(table, cacheKey, initialValue) {
  const { user } = useAuth();
  const supabaseReady = isSupabaseConfigured;

  const [data, setData, isLoading] = useIndexedDB(cacheKey, initialValue);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const fetchingRef = useRef(false);

  const fetchFromCloud = useCallback(async () => {
    if (!supabaseReady || !user || fetchingRef.current) return;
    fetchingRef.current = true;
    setSyncing(true);
    await fetchWithCache(table, user, cacheKey, (cloudData) => {
      setData(cloudData);
    });
    setSyncing(false);
    setLastSync(Date.now());
    fetchingRef.current = false;
  }, [table, cacheKey, user, supabaseReady, setData]);

  useEffect(() => {
    if (!supabaseReady || !user || isLoading) return;
    const timer = setTimeout(() => fetchFromCloud(), 0);
    return () => clearTimeout(timer);
  }, [supabaseReady, user, isLoading, fetchFromCloud]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    const unsubscribe = subscribeToTable(table, user, (cloudData) => {
      setData(cloudData);
      setLastSync(Date.now());
    });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [table, user, supabaseReady, setData]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    const onOnline = () => fetchFromCloud();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [supabaseReady, user, fetchFromCloud]);

  useEffect(() => {
    if (!supabaseReady || !user) return;
    const interval = setInterval(fetchFromCloud, 60000);
    return () => clearInterval(interval);
  }, [supabaseReady, user, fetchFromCloud]);

  const upsert = useCallback(async (item) => {
    setData((prev) => {
      const exists = prev.find((d) => d.id === item.id);
      if (exists) return prev.map((d) => (d.id === item.id ? { ...d, ...item } : d));
      return [...prev, item];
    });
    await syncUpsert(table, item, user);
  }, [table, user, setData]);

  const remove = useCallback(async (id) => {
    setData((prev) => prev.filter((d) => d.id !== id));
    await syncDelete(table, id, user);
  }, [table, user, setData]);

  return {
    data,
    setData,
    isLoading,
    syncing,
    lastSync,
    fetchFromCloud,
    upsert,
    remove,
  };
}
