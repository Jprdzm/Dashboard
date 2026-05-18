import { useState } from 'react';
import { Plus, Trash2, Minus } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { sanitizeInput } from '../utils/sanitize';

const MAX = 100;

export default function ProjectTracker() {
  const [projects, setProjects] = useIndexedDB('projects', []);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProgress, setNewProgress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const name = sanitizeInput(newName);
    if (!name) return;
    const progress = Math.min(Math.max(parseInt(newProgress) || 0, 0), MAX);
    setProjects((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, progress },
    ]);
    setNewName('');
    setNewProgress('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustProgress = (id, delta) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, progress: Math.min(Math.max(p.progress + delta, 0), MAX) }
          : p,
      ),
    );
  };

  const startEditing = (id, current) => {
    setEditingId(id);
    setEditValue(String(current));
  };

  const commitEdit = (id) => {
    const num = Math.min(Math.max(parseInt(editValue) || 0, 0), MAX);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, progress: num } : p)),
    );
    setEditingId(null);
  };

  return (
    <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md transition-colors duration-300 shadow-sm shadow-slate-200/50 dark:shadow-none hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text-light dark:text-text-dark">
          Proyectos
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="p-1.5 rounded-md border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-bg-dark transition-colors duration-200"
          aria-label="Agregar proyecto"
        >
          <Plus size={16} />
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 p-3 rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark space-y-2"
        >
          <input
            type="text"
            placeholder="Nombre del proyecto"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={MAX}
              placeholder="Progreso inicial (%)"
              value={newProgress}
              onChange={(e) => setNewProgress(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
            >
              Añadir
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {projects.length === 0 && !showForm && (
          <p className="text-sm text-textMuted-light dark:text-textMuted-dark text-center py-6">
            No hay proyectos todavía. Presiona + para agregar uno.
          </p>
        )}
        {projects.map((project) => (
          <div key={project.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-light dark:text-text-dark leading-snug pr-2">
                {project.name}
              </span>
              <button
                onClick={() => handleDelete(project.id)}
                className="p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0 ml-2"
                aria-label={`Eliminar ${project.name}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustProgress(project.id, -10)}
                disabled={project.progress <= 0}
                className="p-1 rounded-md border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-bg-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={`Disminuir ${project.name}`}
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 h-2 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              {editingId === project.id ? (
                <input
                  type="number"
                  min="0"
                  max={MAX}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(project.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-14 px-1 py-0.5 text-xs font-medium tabular-nums text-center rounded-md border border-indigo-400 dark:border-indigo-500 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => startEditing(project.id, project.progress)}
                  className="text-xs font-medium tabular-nums text-textMuted-light dark:text-textMuted-dark hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shrink-0 min-w-[2rem] text-right cursor-pointer"
                  aria-label={`Editar progreso de ${project.name}`}
                >
                  {project.progress}%
                </button>
              )}
              <button
                onClick={() => adjustProgress(project.id, 10)}
                disabled={project.progress >= MAX}
                className="p-1 rounded-md border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-bg-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={`Incrementar ${project.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
