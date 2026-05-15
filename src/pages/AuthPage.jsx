import { useState } from 'react';
import supabase from '../services/supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    const action = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });

    const { error: err } = await action;
    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (isSignUp) {
      setMessage('Revisa tu correo para confirmar la cuenta.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-text-light dark:text-text-dark mb-6 text-center">
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1">
              Correo
            </label>
            <input
              type="email"
              required
              autoComplete={isSignUp ? 'email' : 'username'}
              placeholder="juan@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {message && (
            <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white transition-colors"
          >
            {submitting
              ? 'Procesando…'
              : isSignUp
                ? 'Registrarse'
                : 'Entrar'}
          </button>
        </form>

        <p className="mt-5 text-xs text-center text-textMuted-light dark:text-textMuted-dark">
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            onClick={() => { setMode(isSignUp ? 'login' : 'signup'); setError(''); setMessage(''); }}
            className="text-blue-500 hover:text-blue-600 font-medium underline underline-offset-2"
          >
            {isSignUp ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
}
