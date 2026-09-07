import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { sanitizeInput } from '../utils/sanitize';
import useSyncData from '../hooks/useSyncData';

const MAX = 100;

function progressColor(pct) {
  if (pct >= 100) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 67)  return { stroke: '#171717', text: 'text-neutral-900 dark:text-neutral-100' };
  if (pct >= 34)  return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' };
  return           { stroke: '#f43f5e', text: 'text-rose-600 dark:text-rose-400' };
}

function DonutChart({ value = 0, size = 88, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  const { stroke: strokeColor, text } = progressColor(value);
  const cx = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={strokeColor}
          className="transition-all duration-500 ease-soft-out"
        />
      </svg>
      <span className={`absolute text-base font-bold tabular-nums leading-none ${text}`}>
        {value}%
      </span>
    </div>
  );
}

export default function ProjectTracker() {
  const { data: projects, upsert, remove } = useSyncData('proyectos', 'proyectos_cache', []);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProgress, setNewProgress] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = sanitizeInput(newName);
    if (!name) return;
    const progress = Math.min(Math.max(parseInt(newProgress) || 0, 0), MAX);
    await upsert({ id: crypto.randomUUID(), name, progress });
    setNewName('');
    setNewProgress('');
    setShowForm(false);
  };

  const handleDelete = (id) => remove(id);

  const adjustProgress = async (id, delta) => {
    const p = projects.find((p) => p.id === id);
    if (!p) return;
    await upsert({ ...p, progress: Math.min(Math.max(p.progress + delta, 0), MAX) });
  };

  return (
    <div className="p-5 rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:scale-[1.015] hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-all duration-300 ease-soft-out">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-text-light dark:text-text-dark text-sm">Proyectos</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="p-1.5 rounded-md border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-white/[0.06] hover:text-text-light dark:hover:text-text-dark transition-all duration-200 ease-soft-out active:scale-[0.95]"
          aria-label="Agregar proyecto"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 p-3 rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark flex gap-2 items-end"
        >
          <div className="flex-1 space-y-1">
            <input
              type="text"
              placeholder="Nombre del proyecto"
              value={newName}
              maxLength={80}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-neutral-500/40 transition-colors"
              autoFocus
            />
          </div>
          <div className="w-20">
            <input
              type="number"
              min="0"
              max={MAX}
              placeholder="%"
              value={newProgress}
              onChange={(e) => setNewProgress(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-neutral-500/40 transition-colors text-center"
            />
          </div>
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors"
          >
            <Check size={15} />
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Tarjeta "+ Nuevo proyecto" siempre visible: evita huecos con pocos proyectos
            y da una segunda vía (además del botón de la esquina) para abrir el formulario. */}
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex-shrink-0 w-36 sm:w-40 flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-accent-light/40 dark:border-accent-dark/40 text-accent-light dark:text-accent-dark hover:border-accent-light dark:hover:border-accent-dark hover:bg-accent-light/5 dark:hover:bg-accent-dark/10 transition-all duration-200 ease-soft-out active:scale-[0.98]"
            aria-label="Agregar nuevo proyecto"
          >
            <div className="w-11 h-11 flex items-center justify-center rounded-full border-2 border-dashed border-current/40">
              <Plus size={18} />
            </div>
            <span className="text-xs font-semibold">Nuevo proyecto</span>
          </button>
        )}

        {projects.map((project) => {
          const { text } = progressColor(project.progress);
          return (
            <div
              key={project.id}
              className="relative flex-shrink-0 w-36 sm:w-40 flex flex-col items-center gap-2 p-3 rounded-2xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:border-neutral-300 dark:hover:border-neutral-700/50 hover:shadow-soft-sm dark:hover:shadow-soft-dark-sm hover:-translate-y-0.5 transition-all duration-200 ease-soft-out group"
            >
              {/* Delete */}
              <button
                onClick={() => handleDelete(project.id)}
                className="absolute top-2 right-2 p-1 rounded text-textMuted-light/40 dark:text-textMuted-dark/40 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label={`Eliminar ${project.name}`}
              >
                <Trash2 size={12} />
              </button>

              {/* Name */}
              <p className="text-xs font-semibold text-text-light dark:text-text-dark text-center leading-tight w-full truncate px-5">
                {project.name}
              </p>

              {/* Donut */}
              <DonutChart value={project.progress} />

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustProgress(project.id, -10)}
                  disabled={project.progress <= 0}
                  className="w-6 h-6 rounded-full border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-white/[0.06] hover:text-text-light dark:hover:text-text-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 ease-soft-out active:scale-[0.9] text-sm font-bold leading-none flex items-center justify-center"
                  aria-label="Disminuir"
                >
                  −
                </button>
                <span className={`text-[11px] font-semibold tabular-nums w-8 text-center ${text}`}>
                  {project.progress}%
                </span>
                <button
                  onClick={() => adjustProgress(project.id, 10)}
                  disabled={project.progress >= MAX}
                  className="w-6 h-6 rounded-full border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-white/[0.06] hover:text-text-light dark:hover:text-text-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 ease-soft-out active:scale-[0.9] text-sm font-bold leading-none flex items-center justify-center"
                  aria-label="Incrementar"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
