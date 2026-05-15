import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { usePomodoro } from '../hooks/usePomodoro';

export default function PomodoroTimer() {
  const {
    timeLeft,
    isRunning,
    isBreak,
    breakDuration,
    setBreakDuration,
    play,
    pause,
    reset,
  } = usePomodoro();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300 hover:shadow-sm flex flex-col items-center text-center">
      <div className="flex items-center gap-2 mb-2">
        {isBreak ? (
          <Coffee size={18} className="text-blue-500" />
        ) : (
          <Brain size={18} className="text-blue-500" />
        )}
        <span className="text-sm font-medium text-textMuted-light dark:text-textMuted-dark">
          {isBreak ? 'Descanso' : 'Trabajo'}
        </span>
      </div>

      <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight text-text-light dark:text-text-dark mb-4">
        {formattedTime}
      </span>

      <div className="flex items-center gap-3 mb-4">
        {isRunning ? (
          <button
            onClick={pause}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
            aria-label="Pausar"
            title="Pausar"
          >
            <Pause size={20} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={play}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
            aria-label="Iniciar"
            title="Iniciar"
          >
            <Play size={20} fill="currentColor" />
          </button>
        )}
        <button
          onClick={reset}
          className="p-2 rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors duration-200"
          aria-label="Reiniciar"
          title="Reiniciar"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark">
          Descanso:
        </span>
        <button
          onClick={() => setBreakDuration(5)}
          className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors duration-200 ${
            breakDuration === 5
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-surface-light dark:hover:bg-surface-dark'
          }`}
        >
          5 min
        </button>
        <button
          onClick={() => setBreakDuration(15)}
          className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors duration-200 ${
            breakDuration === 15
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-surface-light dark:hover:bg-surface-dark'
          }`}
        >
          15 min
        </button>
      </div>

      <p className="mt-4 text-xs text-textMuted-light dark:text-textMuted-dark leading-relaxed max-w-xs">
        Enfoque actual: Redacción del meta-análisis sobre síndrome de Cushing
      </p>
    </div>
  );
}
