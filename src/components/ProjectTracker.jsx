import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { sanitizeInput } from '../utils/sanitize';
import useSyncData from '../hooks/useSyncData';

const MAX = 100;

function progressColor(pct) {
  if (pct >= 100) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' };
  if (pct >= 67)  return { stroke: '#6366f1', text: 'text-indigo-600 dark:text-indigo-400' };
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
          className="transition-all duration-500"
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
    <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">Proyectos</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="p-1.5 rounded-md border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
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
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
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
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors text-center"
            />
          </div>
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
          >
            <Check size={15} />
          </button>
        </form>
      )}

      {projects.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark">
            No hay proyectos. Presiona + para agregar uno.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {projects.map((project) => {
            const { text } = progressColor(project.progress);
            return (
              <div
                key={project.id}
                className="relative flex flex-col items-center gap-2 p-3 rounded-xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-200 group"
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
                    className="w-6 h-6 rounded-full border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold leading-none flex items-center justify-center"
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
                    className="w-6 h-6 rounded-full border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold leading-none flex items-center justify-center"
                    aria-label="Incrementar"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
