import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Plus, Trash2, Calendar, Calculator, Loader2 } from 'lucide-react';
import gradesConfig from '../config/grades.config.js';
import useSyncData from '../hooks/useSyncData';
import { useAuth } from '../services/AuthContext';
import {
  calcularComponente,
  calcularPromedioMateria,
  resolverNecesario,
  semaforoColor,
  slugify,
} from '../utils/grades';
import { safeParseFloat } from '../utils/sanitize';
import { useToast } from '../components/Toast';
import { upsertCalendarEvent, removeCalendarEvent, gradeEventId } from '../services/calendarEvents';

const { escala, semaforo, materias, semestre } = gradesConfig;

const SEMAFORO_DOT = {
  verde: 'bg-green-500',
  ambar: 'bg-amber-500',
  rojo: 'bg-red-500',
};

const SEMAFORO_BORDER = {
  verde: 'border-l-4 border-l-green-500',
  ambar: 'border-l-4 border-l-amber-500',
  rojo: 'border-l-4 border-l-red-500',
};

const SEMAFORO_LABEL = {
  verde: 'Verde',
  ambar: 'Ámbar',
  rojo: 'Rojo',
};

// Un componente/subcomponente se considera "evaluable" (admite fecha en el calendario)
// si su nombre normalizado contiene "examen" o "parcial" — cubre Parcial 1/2/3, Examen
// final, Examen ordinario (final), Examen escrito final, etc. sin necesidad de marcarlo
// manualmente en la config.
function esFechable(nombre) {
  const slug = slugify(nombre);
  return /examen|parcial/.test(slug);
}

function clampGrade(num) {
  return Math.min(Math.max(num, escala.min), escala.max);
}

// '' o inválido -> undefined (borra la calificación). Válido -> clamp a la escala.
function parseGradeOrUndefined(raw) {
  if (raw === '' || raw === null || raw === undefined) return undefined;
  const num = safeParseFloat(raw, NaN);
  if (Number.isNaN(num)) return undefined;
  return clampGrade(num);
}

const INPUT_CLASS =
  'px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors';

export default function CalificacionesPage() {
  const addToast = useToast();
  const { user } = useAuth();
  const { data: gradesRows, upsert: upsertGradeRow, isLoading } = useSyncData('calificaciones', 'grades_data_rows', []);
  const [solverState, setSolverState] = useState({});

  // Vista derivada: { [materiaId]: { ...componentes capturados, fechas } }.
  // Se mantiene esta forma (en vez de leer gradesRows directamente) para no
  // tocar el resto de la lógica de render, que ya espera gradesData[materiaId].
  const gradesData = useMemo(() => {
    const rows = Array.isArray(gradesRows) ? gradesRows : [];
    return Object.fromEntries(rows.map((r) => [r.materia_id, r.data || {}]));
  }, [gradesRows]);

  async function saveMateriaData(materiaId, newData) {
    await upsertGradeRow({ id: `${user.id}-${materiaId}`, materia_id: materiaId, data: newData });
  }

  const materiaStats = useMemo(() => {
    const map = {};
    for (const materia of materias) {
      map[materia.id] = calcularPromedioMateria(materia, gradesData[materia.id]);
    }
    return map;
  }, [gradesData]);

  const resumen = useMemo(() => {
    const conDato = materias
      .map((m) => materiaStats[m.id])
      .filter((s) => s.promedio !== null);
    const promedioGeneral =
      conDato.length > 0 ? conDato.reduce((s, m) => s + m.promedio, 0) / conDato.length : null;

    const counts = { verde: 0, ambar: 0, rojo: 0, pendiente: 0 };
    for (const materia of materias) {
      const color = semaforoColor(materiaStats[materia.id].promedio, semaforo);
      if (color) counts[color] += 1;
      else counts.pendiente += 1;
    }
    return { promedioGeneral, incompletas: materias.length - conDato.length, counts };
  }, [materiaStats]);

  async function updateLeaf(materiaId, slug, raw) {
    const value = parseGradeOrUndefined(raw);
    const materiaPrev = { ...(gradesData[materiaId] || {}) };
    if (value === undefined) delete materiaPrev[slug];
    else materiaPrev[slug] = value;
    await saveMateriaData(materiaId, materiaPrev);
  }

  async function updateSubValue(materiaId, topSlug, subSlug, raw) {
    const value = parseGradeOrUndefined(raw);
    const materiaPrev = { ...(gradesData[materiaId] || {}) };
    const subPrev = { ...(materiaPrev[topSlug] || {}) };
    if (value === undefined) delete subPrev[subSlug];
    else subPrev[subSlug] = value;
    materiaPrev[topSlug] = subPrev;
    await saveMateriaData(materiaId, materiaPrev);
  }

  async function addSubNota(materiaId, topSlug) {
    const materiaPrev = { ...(gradesData[materiaId] || {}) };
    const arr = Array.isArray(materiaPrev[topSlug]) ? materiaPrev[topSlug] : [];
    materiaPrev[topSlug] = [...arr, null];
    await saveMateriaData(materiaId, materiaPrev);
  }

  async function updateSubNota(materiaId, topSlug, index, raw) {
    const value = parseGradeOrUndefined(raw);
    const materiaPrev = { ...(gradesData[materiaId] || {}) };
    const arr = Array.isArray(materiaPrev[topSlug]) ? [...materiaPrev[topSlug]] : [];
    arr[index] = value === undefined ? null : value;
    materiaPrev[topSlug] = arr;
    await saveMateriaData(materiaId, materiaPrev);
  }

  async function removeSubNota(materiaId, topSlug, index) {
    const materiaPrev = { ...(gradesData[materiaId] || {}) };
    const arr = Array.isArray(materiaPrev[topSlug]) ? [...materiaPrev[topSlug]] : [];
    arr.splice(index, 1);
    materiaPrev[topSlug] = arr;
    await saveMateriaData(materiaId, materiaPrev);
  }

  function handleGuardarBlur() {
    addToast('Calificación guardada', 'success', 2000);
  }

  async function handleFechaChange(materia, key, componenteNombre, dateStr) {
    const materiaPrev = { ...(gradesData[materia.id] || {}) };
    const fechasPrev = { ...(materiaPrev.fechas || {}) };
    if (dateStr) fechasPrev[key] = dateStr;
    else delete fechasPrev[key];
    materiaPrev.fechas = fechasPrev;
    await saveMateriaData(materia.id, materiaPrev);

    const eventId = gradeEventId(materia.id, key, user.id);

    if (!dateStr) {
      try {
        await removeCalendarEvent(eventId, user);
        addToast('Fecha eliminada del calendario', 'success', 2000);
      } catch (err) {
        console.error('[CalificacionesPage] Error al eliminar la fecha del calendario:', err);
      }
      return;
    }

    try {
      await upsertCalendarEvent({
        id: eventId,
        title: `${materia.nombre} · ${componenteNombre}`,
        date: dateStr,
        startTime: null,
        endTime: null,
        type: 'examen',
        materiaId: materia.id,
        description: '',
        source: 'grades',
      }, user);
      addToast('Fecha sincronizada con el calendario', 'success', 2500);
    } catch (err) {
      console.error('[CalificacionesPage] Error al sincronizar fecha con el calendario:', err);
    }
  }

  function handleCalcular(materia, pendientes) {
    const state = solverState[materia.id] || {};
    const promedioDeseado = safeParseFloat(state.promedioDeseado, escala.aprobatoria);
    const objetivo = state.componenteObjetivo || pendientes[0]?.nombre;
    if (!objetivo) return;
    const resultado = resolverNecesario(materia, gradesData[materia.id], objetivo, promedioDeseado, escala);
    setSolverState((prev) => ({
      ...prev,
      [materia.id]: { ...prev[materia.id], componenteObjetivo: objetivo, resultado },
    }));
  }

  function renderFecha(materia, key, componenteNombre, materiaData) {
    const fecha = materiaData?.fechas?.[key] || '';
    return (
      <label className="flex items-center gap-1.5 text-xs text-textMuted-light dark:text-textMuted-dark shrink-0">
        <Calendar size={13} />
        <input
          type="date"
          value={fecha}
          onChange={(e) => handleFechaChange(materia, key, componenteNombre, e.target.value)}
          className={`${INPUT_CLASS} py-1 px-2 text-xs [color-scheme:light] dark:[color-scheme:dark]`}
        />
      </label>
    );
  }

  function renderComponente(materia, componente, materiaData) {
    const topSlug = slugify(componente.nombre);

    if (componente.subcomponentes) {
      const dataObj = materiaData?.[topSlug];
      return (
        <div key={topSlug} className="space-y-2">
          <p className="text-sm font-medium text-text-light dark:text-text-dark">
            {componente.nombre} <span className="text-textMuted-light dark:text-textMuted-dark font-normal">({componente.peso}%)</span>
          </p>
          <div className="pl-3 border-l-2 border-border-light dark:border-border-dark space-y-2">
            {componente.subcomponentes.map((sub) => {
              const subSlug = slugify(sub.nombre);
              const fechaKey = `${topSlug}--${subSlug}`;
              const value = dataObj?.[subSlug];
              return (
                <div key={subSlug} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-textMuted-light dark:text-textMuted-dark w-full sm:w-auto sm:flex-1">
                    {sub.nombre} ({sub.peso}%)
                  </span>
                  <input
                    type="number"
                    min={escala.min}
                    max={escala.max}
                    step="0.1"
                    placeholder="Nota"
                    value={value ?? ''}
                    onChange={(e) => updateSubValue(materia.id, topSlug, subSlug, e.target.value)}
                    onBlur={handleGuardarBlur}
                    className={`${INPUT_CLASS} w-24`}
                  />
                  {esFechable(sub.nombre) && renderFecha(materia, fechaKey, `${componente.nombre} · ${sub.nombre}`, materiaData)}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (componente.subNotas) {
      const arr = Array.isArray(materiaData?.[topSlug]) ? materiaData[topSlug] : [];
      return (
        <div key={topSlug} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-text-light dark:text-text-dark">
              {componente.nombre} <span className="text-textMuted-light dark:text-textMuted-dark font-normal">({componente.peso}%, promedio simple)</span>
            </span>
            <div className="flex items-center gap-2">
              {esFechable(componente.nombre) && renderFecha(materia, topSlug, componente.nombre, materiaData)}
              <button
                type="button"
                onClick={() => addSubNota(materia.id, topSlug)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-indigo-500 hover:bg-indigo-600 active:scale-[0.96] text-white transition-all duration-150 ease-soft-out"
              >
                <Plus size={12} /> Nota
              </button>
            </div>
          </div>
          {arr.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-3">
              {arr.map((n, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <input
                    type="number"
                    min={escala.min}
                    max={escala.max}
                    step="0.1"
                    placeholder="Nota"
                    value={n ?? ''}
                    onChange={(e) => updateSubNota(materia.id, topSlug, idx, e.target.value)}
                    onBlur={handleGuardarBlur}
                    className={`${INPUT_CLASS} w-20`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubNota(materia.id, topSlug, idx)}
                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all duration-150 ease-soft-out"
                    aria-label="Quitar nota"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // hoja simple
    const value = materiaData?.[topSlug];
    return (
      <div key={topSlug} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-light dark:text-text-dark w-full sm:w-auto sm:flex-1">
          {componente.nombre} <span className="text-textMuted-light dark:text-textMuted-dark">({componente.peso}%)</span>
        </span>
        <input
          type="number"
          min={escala.min}
          max={escala.max}
          step="0.1"
          placeholder="Nota"
          value={value ?? ''}
          onChange={(e) => updateLeaf(materia.id, topSlug, e.target.value)}
          onBlur={handleGuardarBlur}
          className={`${INPUT_CLASS} w-24`}
        />
        {esFechable(componente.nombre) && renderFecha(materia, topSlug, componente.nombre, materiaData)}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <GraduationCap size={24} className="text-indigo-500" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-light dark:text-text-dark">
            Calculadora de Calificaciones
          </h1>
        </div>
        <p className="text-sm text-textMuted-light dark:text-textMuted-dark mb-8">{semestre}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-shadow duration-300 ease-soft-out">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Promedio general del semestre
            </span>
            <p className="text-4xl font-bold mt-1 text-fuchsia-600 dark:text-fuchsia-400 tabular-nums">
              {resumen.promedioGeneral !== null ? resumen.promedioGeneral.toFixed(1) : 'N/D'}
            </p>
            <p className="text-xs text-textMuted-light dark:text-textMuted-dark mt-1">
              {resumen.incompletas > 0
                ? `${resumen.incompletas} materia${resumen.incompletas === 1 ? '' : 's'} sin capturar / incompleta${resumen.incompletas === 1 ? '' : 's'}`
                : 'Todas las materias tienen datos capturados'}
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-shadow duration-300 ease-soft-out">
            <span className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark uppercase tracking-wide">
              Semáforo
            </span>
            <p className="text-sm mt-2 text-text-light dark:text-text-dark">
              <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /><span className="tabular-nums">{resumen.counts.verde}</span>&nbsp;verde</span>
              <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /><span className="tabular-nums">{resumen.counts.ambar}</span>&nbsp;ámbar</span>
              <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /><span className="tabular-nums">{resumen.counts.rojo}</span>&nbsp;rojo</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" /><span className="tabular-nums">{resumen.counts.pendiente}</span>&nbsp;pendientes</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materias.map((materia) => {
            const materiaData = gradesData[materia.id];
            const stats = materiaStats[materia.id];
            const color = semaforoColor(stats.promedio, semaforo);
            const pendientes = materia.componentes.filter(
              (c) => calcularComponente(c, materiaData?.[slugify(c.nombre)]) === null,
            );
            const solver = solverState[materia.id] || {};

            return (
              <div
                key={materia.id}
                className={`p-5 rounded-2xl rounded-l-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-shadow duration-300 ease-soft-out ${color ? SEMAFORO_BORDER[color] : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="font-semibold text-text-light dark:text-text-dark">{materia.nombre}</h2>
                  {color && (
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${SEMAFORO_DOT[color]}`} title={SEMAFORO_LABEL[color]} />
                  )}
                </div>
                {materia.nota && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">⚠ {materia.nota}</p>
                )}

                <div className="space-y-4 mb-4">
                  {materia.componentes.map((componente) => renderComponente(materia, componente, materiaData))}
                </div>

                <div className="pt-3 border-t border-border-light dark:border-border-dark mb-4">
                  <p className="text-sm text-text-light dark:text-text-dark">
                    Promedio actual:{' '}
                    <span className="font-semibold tabular-nums">
                      {stats.promedio !== null ? stats.promedio.toFixed(2) : 'N/D'}
                    </span>{' '}
                    <span className="text-textMuted-light dark:text-textMuted-dark tabular-nums">
                      ({stats.porcentajeEvaluado.toFixed(0)}% evaluado)
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-border-light dark:border-border-dark">
                  <p className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-2 flex items-center gap-1.5">
                    <Calculator size={13} /> ¿Qué necesito?
                  </p>
                  {pendientes.length === 0 ? (
                    <p className="text-xs text-textMuted-light dark:text-textMuted-dark">
                      Todos los componentes ya están capturados.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={escala.min}
                        max={escala.max}
                        step="0.1"
                        value={solver.promedioDeseado ?? String(escala.aprobatoria + 2 <= escala.max ? escala.aprobatoria + 2 : escala.aprobatoria)}
                        onChange={(e) =>
                          setSolverState((prev) => ({
                            ...prev,
                            [materia.id]: { ...prev[materia.id], promedioDeseado: e.target.value },
                          }))
                        }
                        className={`${INPUT_CLASS} w-20`}
                      />
                      <select
                        value={solver.componenteObjetivo || pendientes[0].nombre}
                        onChange={(e) =>
                          setSolverState((prev) => ({
                            ...prev,
                            [materia.id]: { ...prev[materia.id], componenteObjetivo: e.target.value },
                          }))
                        }
                        className={`${INPUT_CLASS} flex-1 min-w-[9rem]`}
                      >
                        {pendientes.map((c) => (
                          <option key={c.nombre} value={c.nombre}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleCalcular(materia, pendientes)}
                        className="px-3 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white transition-all duration-150 ease-soft-out"
                      >
                        Calcular
                      </button>
                    </div>
                  )}
                  {solver.resultado && (
                    <p
                      className={`text-sm mt-2 font-medium ${
                        solver.resultado.imposible ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {solver.resultado.imposible
                        ? `Ya no es posible: necesitarías ${solver.resultado.necesario.toFixed(1)}, y la escala máxima es ${escala.max}.`
                        : `Necesitas ${Math.max(solver.resultado.necesario, escala.min).toFixed(1)} en "${solver.componenteObjetivo}".`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
