/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
      }
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (configError) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1a1f2e] rounded-xl shadow-lg p-6 border border-red-500/30">
          <h2 className="text-xl font-bold text-red-500 mb-4">Faltan Variables de Entorno</h2>
          <p className="mb-4">
            La aplicación no puede conectar con Supabase porque faltan las credenciales.
          </p>
          <p className="text-sm text-textMuted-light dark:text-textMuted-dark mb-4">
            Asegúrate de configurar <code className="bg-slate-100 dark:bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> y <code className="bg-slate-100 dark:bg-black/30 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> en las variables de entorno de Vercel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading, user: session?.user ?? null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
