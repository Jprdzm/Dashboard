import React from 'react';
import { Plus } from 'lucide-react';
import { useIndexedDB } from '../hooks/useIndexedDB';

const STEP = 10;
const MAX = 100;

const DEFAULT_PROJECTS = [
  { id: 1, name: 'Meta-análisis de Cushing (Revisión de literatura)', progress: 0 },
  { id: 2, name: 'Gestor de expedientes clínicos NOM-024 (Integración SQLite)', progress: 0 },
  { id: 3, name: 'Artículos para Estancia Villas Juan Pablo', progress: 0 },
];

export default function ProjectTracker() {
  const [projects, setProjects] = useIndexedDB('projects', DEFAULT_PROJECTS);

  const increment = (id) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, progress: Math.min(p.progress + STEP, MAX) } : p,
      ),
    );
  };

  return (
    <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300 hover:shadow-sm">
      <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark">
        Proyectos
      </h2>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-text-light dark:text-text-dark leading-snug pr-2">
                {project.name}
              </span>
              <span className="text-xs font-medium tabular-nums text-textMuted-light dark:text-textMuted-dark shrink-0">
                {project.progress}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <button
                onClick={() => increment(project.id)}
                disabled={project.progress >= MAX}
                className="p-1 rounded-md border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
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
