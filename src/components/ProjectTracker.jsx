import { useState } from 'react';
import { Plus, Trash2, Minus } from 'lucide-react';
import { sanitizeInput } from '../utils/sanitize';
import useSyncData from '../hooks/useSyncData';

const MAX = 100;

export default function ProjectTracker() {
  const {
    data: projects,
    upsert,
    remove,
  } = useSyncData('proyectos', 'proyectos_cache', []);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProgress, setNewProgress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

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

  const handleDelete = (id) => {
    remove(id);
  };

  const adjustProgress = async (id, delta) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const newProgress = Math.min(Math.max(project.progress + delta, 0), MAX);
    await upsert({ ...project, progress: newProgress });
  };

  const startEditing = (id, current) => {
    setEditingId(id);
    setEditValue(String(current));
  };

  const commitEdit = async (id) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const num = Math.min(Math.max(parseInt(editValue) || 0, 0), MAX);
    await upsert({ ...project, progress: num });
    setEditingId(null);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-text-primary dark:text-text-primary">
          Proyectos
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-secondary"
          aria-label="Agregar proyecto"
        >
          <Plus size={16} />
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 p-4 rounded-xl border border-border dark:border-border-dark bg-background dark:bg-background-dark space-y-4"
        >
          <div className="space-y-2">
            <label className="label">
              Nombre del proyecto
            </label>
            <input
              type="text"
              placeholder="Nombre del proyecto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-center gap-3 space-y-2">
            <div>
              <label className="label">
                Progreso inicial (%)
              </label>
              <input
                type="number"
                min="0"
                max={MAX}
                placeholder="Progreso inicial (%)"
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
                className="input w-full max-w-xs"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
            >
              Añadir
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {projects.length === 0 && !showForm && (
          <div className="text-center py-8">
            <p className="text-muted/500 dark:text-muted/400">
              No hay proyectos todavía. Presiona + para agregar uno.
            </p>
          </div>
        )}
        {projects.map((project) => (
          <div key={project.id} className="border-b border-border/20 dark:border-border-dark/20 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-primary dark:text-text-primary leading-snug">
                {project.name}
              </span>
              <button
                onClick={() => handleDelete(project.id)}
                className="p-1 rounded text-danger/500 dark:text-danger-dark-mode/500 hover:text-danger/700 dark:hover:text-danger-dark-mode/700 transition-colors duration-200"
                aria-label={`Eliminar ${project.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjustProgress(project.id, -10)}
                disabled={project.progress <= 0}
                className="p-1.5 rounded border border-muted/200 dark:border-muted/200 text-muted/500 dark:text-muted/400 hover:bg-muted/50 dark:hover:bg-muted/300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={`Disminuir ${project.name}`}
              >
                <Minus size={16} />
              </button>
              <div className="flex-1 h-2.5 rounded-full bg-muted/200 dark:bg-muted/100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/700 dark:bg-primary-dark-mode/700 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              {editingId === project.id ? (
                <div className="w-20 space-y-1">
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
                    className="input text-center"
                  />
                </div>
              ) : (
                <button
                  onClick={() => startEditing(project.id, project.progress)}
                  className="text-xs font-medium tabular-nums text-muted/500 dark:text-muted/400 hover:text-primary/700 dark:hover:text-primary-dark-mode/700 transition-colors duration-200"
                  aria-label={`Editar progreso de ${project.name}`}
                >
                  {project.progress}%
                </button>
              )}
              <button
                onClick={() => adjustProgress(project.id, 10)}
                disabled={project.progress >= MAX}
                className="p-1.5 rounded border border-muted/200 dark:border-muted/200 text-muted/500 dark:text-muted/400 hover:bg-muted/50 dark:hover:bg-muted/300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={`Incrementar ${project.name}`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
