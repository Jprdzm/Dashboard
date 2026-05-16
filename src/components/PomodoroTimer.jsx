import { useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Pencil } from 'lucide-react';
import { usePomodoro } from '../hooks/usePomodoro';
import { useIndexedDB } from '../hooks/useIndexedDB';

const MODES = [
  { key: 'work', label: 'Trabajo', minutes: 25, short: '25m' },
  { key: 'short', label: 'Corto', minutes: 5, short: '5m' },
  { key: 'long', label: 'Largo', minutes: 15, short: '15m' },
];

export default function PomodoroTimer() {
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const activeMode = isBreak
    ? (timeLeft > 5 * 60 ? MODES[2] : MODES[1])
    : MODES[0];

  const isWork = !isBreak;

  const startEditFocus = () => {
    setFocusDraft(focus);
    setEditingFocus(true);
  };

  const commitFocus = () => {
    const trimmed = focusDraft.trim();
    if (trimmed) setFocus(trimmed);
    setEditingFocus(false);
  };

  return (
    <div
      className="relative overflow-hidden p-8 rounded-2xl border border-white/20 dark:border-gray-700/30
        bg-white/60 dark:bg-gray-900/60 backdrop-blur-md
        shadow-xl shadow-gray-100/50 dark:shadow-none
        transition-all duration-500 flex flex-col items-center text-center"
    >
      <div className="flex items-center gap-2 mb-3">
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

      <span
        className="font-mono font-bold tracking-tight text-5xl sm:text-6xl
          text-gray-800 dark:text-gray-100 leading-none mb-6 select-none"
      >
        {formattedTime}
      </span>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={reset}
          className="flex items-center justify-center w-9 h-9 rounded-full
            border border-gray-200 dark:border-gray-700
            text-gray-400 dark:text-gray-500
            hover:text-gray-600 dark:hover:text-gray-300
            hover:border-gray-300 dark:hover:border-gray-600
            hover:bg-white/60 dark:hover:bg-gray-800/60
            transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Reiniciar"
          title="Reiniciar"
        >
          <RotateCcw size={14} />
        </button>

        {isRunning ? (
          <button
            onClick={pause}
            className="flex items-center justify-center w-12 h-12 rounded-full
              bg-gray-800 dark:bg-gray-100
              text-gray-100 dark:text-gray-800
              hover:bg-gray-700 dark:hover:bg-gray-200
              shadow-lg shadow-gray-800/10 dark:shadow-none
              transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Pausar"
            title="Pausar"
          >
            <Pause size={20} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={play}
            className="flex items-center justify-center w-12 h-12 rounded-full
              bg-gray-800 dark:bg-gray-100
              text-gray-100 dark:text-gray-800
              hover:bg-gray-700 dark:hover:bg-gray-200
              shadow-lg shadow-gray-800/10 dark:shadow-none
              transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Iniciar"
            title="Iniciar"
          >
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-gray-100/60 dark:bg-gray-800/60">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => changeMode(mode.minutes)}
            className={`px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-300 ${
              activeMode.key === mode.key
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {mode.label} ({mode.short})
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1.5 max-w-full">
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
            className="w-full max-w-[20rem] px-3 py-1 text-xs text-center rounded-lg
              border border-gray-300 dark:border-gray-600
              bg-white/80 dark:bg-gray-800/80
              text-gray-700 dark:text-gray-300
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-gray-400/40 dark:focus:ring-gray-500/40
              transition-colors"
            autoFocus
          />
        ) : (
          <button
            onClick={startEditFocus}
            className="group flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500
              hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <span className="leading-relaxed max-w-[18rem] truncate">{focus}</span>
            <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
