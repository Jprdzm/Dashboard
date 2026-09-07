import { useState, useEffect, useMemo } from 'react';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import db from '../services/db';

// Minimal, read-only slice of the logic FinanzasPage.jsx uses to compute the
// "remanente del mes" (ingresos - gastos del mes actual). Deliberately does
// NOT duplicate the rest of FinanzasPage (budgets, charts, CRUD) — just the
// fetch + current-month aggregation, so FinanceCard can show a real number
// on the Dashboard without pulling in ~1300 lines of unrelated UI.
function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useFinanceSummary() {
  const { user } = useAuth();
  const supabaseReady = isSupabaseConfigured;

  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!supabaseReady || !user) {
        try {
          const cached = await db.getItem('finanzas_cache');
          if (!cancelled && Array.isArray(cached)) setTransacciones(cached);
        } catch {
          /* sin cache disponible — se queda vacío */
        }
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('finanzas')
          .select('*')
          .eq('user_id', user.id)
          .order('fecha', { ascending: false });
        if (cancelled) return;
        if (error) {
          const cached = await db.getItem('finanzas_cache');
          if (Array.isArray(cached)) setTransacciones(cached);
        } else if (Array.isArray(data)) {
          setTransacciones(data);
        }
      } catch {
        if (!cancelled) {
          try {
            const cached = await db.getItem('finanzas_cache');
            if (Array.isArray(cached)) setTransacciones(cached);
          } catch { /* ignored */ }
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [supabaseReady, user]);

  const mesActualKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const { ingresosMes, gastosMes } = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    for (const t of transacciones) {
      if (!t || !t.fecha || getMonthKey(t.fecha) !== mesActualKey) continue;
      const monto = Number(t.monto) || 0;
      if (t.tipo === 'ingreso') ingresos += monto;
      else if (t.tipo === 'gasto') gastos += monto;
    }
    return { ingresosMes: ingresos, gastosMes: gastos };
  }, [transacciones, mesActualKey]);

  return {
    loading,
    hasData: transacciones.length > 0,
    ingresosMes,
    gastosMes,
    remanente: ingresosMes - gastosMes,
  };
}

export default useFinanceSummary;
