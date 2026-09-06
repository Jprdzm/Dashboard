import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Pencil, Loader2 } from 'lucide-react';
import { usePomodoro } from '../hooks/usePomodoro';
import { useIndexedDB } from '../hooks/useIndexedDB';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { enrichWithUser } from '../services/withUser';

const MODES = [
  { key: 'work', label: 'Trabajo', minutes: 25, short: '25m' },
  { key: 'short', label: 'Corto', minutes: 5, short: '5m' },
  { key: 'long', label: 'Largo', minutes: 15, short: '15m' },
];

export default function PomodoroTimer() {
  const { user } = useAuth();
  const supabaseReady = isSupabaseConfigured;

  const {
    timeLeft,
    isRunning,
    isBreak,
    changeMode,
    play,
    pause,
    reset,
  } = usePomodoro();

  const [focus, setFocus] = useIndexedDB(
    'pomodoro-focus',
    'Redacción del meta-análisis sobre síndrome de Cushing',
  );
  const [editingFocus, setEditingFocus] = useState(false);
  const [focusDraft, setFocusDraft] = useState('');
  const [syncingFocus, setSyncingFocus] = useState(false);

  /* Sync: cargar desde Supabase al montar */
  useEffect(() => {
    if (!supabaseReady || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('value')
          .eq('user_id', user.id)
          .eq('key', 'pomodoro_focus')
          .maybeSingle();
        if (!cancelled && !error && data?.value) {
          setFocus(data.value);
        }
      } catch {
        /* Tabla no existe — silencioso, usa IndexedDB */
      }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setFocus]);

  /* Sync: guardar en Supabase al confirmar */
  const syncFocusToSupabase = async (text) => {
    if (!supabaseReady || !user) return;
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          enrichWithUser({
            key: 'pomodoro_focus',
            value: text,
          }, user),
          { onConflict: 'user_id,key' },
        );
      if (error) console.warn('[Pomodoro] Error al guardar en Supabase:', error.message);
    } catch {
      /* Tabla no existe — silencioso */
    }
    setSyncingFocus(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const activeMode = isBreak
    ? (timeLeft > 5 * 60 ? MODES[2] : MODES[1])
    : MODES[0];

  const isWork = !isBreak;

  /* Radial progress ring — purely presentational, derived from existing state */
  const totalSeconds = activeMode.minutes * 60;
  const progress = totalSeconds > 0
    ? Math.min(Math.max(1 - timeLeft / totalSeconds, 0), 1)
    : 0;
  const RING_R = 88;
  const RING_CIRC = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRC - progress * RING_CIRC;

  const startEditFocus = () => {
    setFocusDraft(focus);
    setEditingFocus(true);
  };

  const commitFocus = () => {
    const trimmed = focusDraft.trim();
    const finalText = trimmed || 'Enfoque de trabajo';
    setFocus(finalText);
    setEditingFocus(false);
    setSyncingFocus(true);
    syncFocusToSupabase(finalText);
  };

  return (
    <div
      className={`relative overflow-hidden p-8 sm:p-10 rounded-2xl border
        bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md
        flex flex-col items-center text-center
        transition-all duration-500 ease-soft-out
        ${isRunning
          ? 'border-indigo-200/70 dark:border-indigo-400/20 shadow-soft-lg dark:shadow-soft-dark-lg shadow-[0_0_44px_-14px_rgba(99,102,241,0.5)] dark:shadow-[0_0_44px_-14px_rgba(129,140,248,0.4)]'
          : 'border-border-light dark:border-border-dark shadow-soft-sm dark:shadow-soft-dark-sm'}`}
    >
      {/* Ambient glow — only while actively running, respects reduced-motion globally */}
      {isRunning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div className="w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 blur-3xl animate-pulse" />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="flex items-center gap-2 mb-5">
          {isWork ? (
            <Brain size={16} className="text-emerald-500" />
          ) : (
            <Coffee size={16} className="text-amber-500" />
          )}
          <span
            className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${
              isWork
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {isWork ? 'Enfoque' : 'Descanso'}
          </span>
        </div>

        {/* Radial progress ring */}
        <div className="relative flex items-center justify-center w-52 h-52 sm:w-60 sm:h-60 mb-7">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle
              cx="100" cy="100" r={RING_R}
              fill="none"
              strokeWidth="10"
              className="stroke-slate-200/70 dark:stroke-slate-700/50"
            />
            <circle
              cx="100" cy="100" r={RING_R}
              fill="none"
              strokeWidth="10"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className={`transition-all duration-500 ease-soft-out ${
                isRunning
                  ? 'stroke-indigo-500 dark:stroke-indigo-400'
                  : 'stroke-indigo-400/60 dark:stroke-indigo-400/40'
              }`}
            />
          </svg>
          <span
            className="absolute font-extrabold tracking-tight text-5xl sm:text-6xl tabular-nums
              text-text-light dark:text-text-dark leading-none select-none"
          >
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={reset}
            className="flex items-center justify-center w-9 h-9 rounded-full
              border border-border-light dark:border-border-dark
              text-textMuted-light dark:text-textMuted-dark
              hover:text-text-light dark:hover:text-text-dark
              hover:border-indigo-300 dark:hover:border-indigo-500/50
              hover:bg-bg-light dark:hover:bg-white/[0.06]
              transition-all duration-200 ease-soft-out hover:scale-105 active:scale-[0.95]"
            aria-label="Reiniciar"
            title="Reiniciar"
          >
            <RotateCcw size={14} />
          </button>

          {isRunning ? (
            <button
              onClick={pause}
              className="flex items-center justify-center w-14 h-14 rounded-full
                bg-indigo-500 hover:bg-indigo-600 text-white
                shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20
                transition-all duration-200 ease-soft-out hover:scale-105 active:scale-[0.95]"
              aria-label="Pausar"
              title="Pausar"
            >
              <Pause size={22} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={play}
              className="flex items-center justify-center w-14 h-14 rounded-full
                bg-slate-800 dark:bg-slate-100
                text-slate-100 dark:text-slate-800
                hover:bg-slate-700 dark:hover:bg-slate-200
                shadow-lg shadow-slate-800/10 dark:shadow-none
                transition-all duration-200 ease-soft-out hover:scale-105 active:scale-[0.95]"
              aria-label="Iniciar"
              title="Iniciar"
            >
              <Play size={22} fill="currentColor" className="ml-0.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-bg-light dark:bg-white/[0.06]">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => changeMode(mode.minutes)}
              className={`px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-200 ease-soft-out ${
                activeMode.key === mode.key
                  ? 'bg-surface-light dark:bg-white/10 text-text-light dark:text-text-dark shadow-soft-sm'
                  : 'text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark'
              }`}
            >
              {mode.label} ({mode.short})
            </button>
          ))}
        </div>

        <div className="mt-5 w-full text-center block mx-auto">
          {editingFocus ? (
            <input
              type="text"
              value={focusDraft}
              onChange={(e) => setFocusDraft(e.target.value)}
              onBlur={commitFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitFocus();
                if (e.key === 'Escape') setEditingFocus(false);
              }}
              className="w-full px-3 py-1.5 text-xs text-center rounded-lg
                border border-border-light dark:border-border-dark
                bg-bg-light dark:bg-bg-dark
                text-text-light dark:text-text-dark
                placeholder-textMuted-light dark:placeholder-textMuted-dark
                focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                transition-all duration-200 ease-soft-out"
              autoFocus
            />
          ) : (
            <button
              onClick={startEditFocus}
              className="group flex items-center justify-center w-full text-center gap-1.5 text-xs text-textMuted-light dark:text-textMuted-dark
                hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 ease-soft-out"
            >
              <span className="leading-relaxed line-clamp-2 break-words text-balance max-w-full">{focus}</span>
              {syncingFocus ? (
                <Loader2 size={11} className="animate-spin shrink-0" />
              ) : (
                <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
