import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import useSyncData from '../hooks/useSyncData';
import gradesConfig from '../config/grades.config.js';
import { calcularPromedioMateria, semaforoColor } from '../utils/grades';

const { materias, semaforo } = gradesConfig;

const SEMAFORO_DOT = {
  verde: 'bg-green-500',
  ambar: 'bg-amber-500',
  rojo: 'bg-red-500',
};

const SEMAFORO_TEXT = {
  verde: 'text-green-600 dark:text-green-400',
  ambar: 'text-amber-600 dark:text-amber-400',
  rojo: 'text-red-600 dark:text-red-400',
};

// Reuses the exact same per-materia aggregation CalificacionesPage.jsx does
// (~L80-86): calcularPromedioMateria per materia off the same cache. Unlike
// that page, this widget only surfaces the per-materia average — not the
// component/subcomponente breakdown — since the dashboard is meant to be a
// glanceable summary, not a second grades page.
export default function SemesterAverageWidget() {
  const { data: gradesRows, isLoading } = useSyncData('calificaciones', 'grades_data_rows', []);

  const gradesData = useMemo(() => {
    const rows = Array.isArray(gradesRows) ? gradesRows : [];
    return Object.fromEntries(rows.map((r) => [r.materia_id, r.data || {}]));
  }, [gradesRows]);

  const materiaStats = useMemo(() => {
    return materias.map((materia) => {
      const stats = calcularPromedioMateria(materia, gradesData[materia.id]);
      return {
        id: materia.id,
        nombre: materia.nombre,
        promedio: stats.promedio,
        color: semaforoColor(stats.promedio, semaforo),
      };
    });
  }, [gradesData]);

  const conDato = materiaStats.filter((m) => m.promedio !== null).length;

  return (
    <div className="p-5 rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:scale-[1.015] hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-all duration-300 ease-soft-out flex flex-col">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-light to-accent-light/80 dark:from-accent-dark dark:to-accent-dark/80 flex items-center justify-center shadow-sm shrink-0">
          <GraduationCap size={16} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading font-semibold text-text-light dark:text-text-dark text-sm">Calificaciones</h2>
        </div>
        <span className="text-[11px] font-medium text-textMuted-light dark:text-textMuted-dark shrink-0">
          {conDato}/{materias.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        </div>
      ) : conDato === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-1">
          <p className="text-xs text-textMuted-light dark:text-textMuted-dark">Sin calificaciones capturadas</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {materiaStats.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-bg-light/60 dark:bg-bg-dark/40 border border-border-light dark:border-border-dark"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${m.promedio !== null ? (SEMAFORO_DOT[m.color] || 'bg-slate-400') : 'bg-slate-300 dark:bg-slate-600'}`} />
              <p className="text-xs font-medium text-text-light dark:text-text-dark truncate flex-1 min-w-0">
                {m.nombre}
              </p>
              <span className={`text-xs font-bold tabular-nums shrink-0 ${m.promedio !== null ? (SEMAFORO_TEXT[m.color] || 'text-text-light dark:text-text-dark') : 'text-textMuted-light dark:text-textMuted-dark'}`}>
                {m.promedio !== null ? m.promedio.toFixed(1) : 'N/D'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/calificaciones"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
      >
        Ver desglose completo <ArrowRight size={13} />
      </Link>
    </div>
  );
}
