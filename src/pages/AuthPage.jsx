import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Brain, Loader2 } from 'lucide-react';
import supabase from '../services/supabaseClient';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4 overflow-hidden">

      {/* ── Fondo decorativo ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-300/10 dark:bg-slate-600/10 blur-[150px]" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* ── Logo / Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/25 mb-4">
            <Brain size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-light dark:text-text-dark">
            Second Brain
          </h1>
          <p className="text-sm text-textMuted-light dark:text-textMuted-dark mt-1">
            {isSignUp ? 'Crea tu cuenta para empezar' : 'Accede a tu segundo cerebro'}
          </p>
        </div>

        {/* ── Card ── */}
        <div className="relative p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 opacity-60" />

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="relative">
              <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted-light dark:text-textMuted-dark pointer-events-none"
                />
                <input
                  type="email"
                  required
                  autoComplete={isSignUp ? 'email' : 'username'}
                  placeholder="juan@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light/60 dark:placeholder-textMuted-dark/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted-light dark:text-textMuted-dark pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light/60 dark:placeholder-textMuted-dark/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-900/15 px-3.5 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-800/30 backdrop-blur-sm">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/15 px-3.5 py-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm">
                <span className="mt-0.5 shrink-0">✓</span>
                <span>{message}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isSignUp ? (
                <UserPlus size={16} />
              ) : (
                <LogIn size={16} />
              )}
              {submitting
                ? 'Procesando…'
                : isSignUp
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-5 text-center">
            <p className="text-xs text-textMuted-light dark:text-textMuted-dark">
              {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            </p>
            <button
              onClick={() => { setMode(isSignUp ? 'login' : 'signup'); setError(''); setMessage(''); }}
              className="mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {isSignUp ? 'Inicia sesión' : 'Crea una cuenta'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[11px] text-center text-textMuted-light/60 dark:text-textMuted-dark/60">
          Al continuar, aceptas los términos y condiciones
        </p>
      </div>
    </div>
  );
}
