import { useState, useEffect, useCallback } from 'react';
import db from '../services/db';

export function useIndexedDB(key, initialValue) {
  const [data, setData] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    db.getItem(key).then((value) => {
      if (cancelled) return;
      if (value !== null) {
        setData(value);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!isLoading) {
      db.setItem(key, data);
    }
  }, [key, data, isLoading]);

  const setIndexedData = useCallback((value) => {
    setData((prev) => (typeof value === 'function' ? value(prev) : value));
  }, []);

  return [data, setIndexedData, isLoading];
}
