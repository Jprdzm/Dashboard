import { useState } from 'react';
import { X, Trash2, Save, Link2 } from 'lucide-react';
import { sanitizeInput, validateEnum } from '../utils/sanitize';
import { EVENT_TYPES, EVENT_TYPE_VALUES } from '../utils/calendarEventTypes';
import gradesConfig from '../config/grades.config.js';
import { Checkbox } from './ui/checkbox';

// Materias del módulo de Calificaciones (contrato compartido). Si el archivo
// llegara a no exportar `materias` por alguna razón, no rompemos el formulario.
const MATERIAS = Array.isArray(gradesConfig?.materias) ? gradesConfig.materias : [];

const inputClass =
  'px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark placeholder-textMuted-light dark:placeholder-textMuted-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors';

const labelClass = 'block text-xs font-medium text-textMuted-light dark:text-textMuted-dark mb-1';

/**
 * Modal form to create/edit a calendar event.
 *
 * Props:
 * - event: existing event object when editing, null when creating.
 * - defaultDate: 'YYYY-MM-DD' to prefill when creating from a day cell.
 * - onSave(data): data = { title, date, startTime, endTime, type, materiaId, description, completed }
 * - onDelete(id): only called when editing.
 * - onClose(): closes the modal without saving.
 */
export default function CalendarEventForm({ event, defaultDate, onSave, onDelete, onClose }) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || defaultDate || '');
  const [startTime, setStartTime] = useState(event?.startTime || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');
  const [type, setType] = useState(validateEnum(event?.type, EVENT_TYPE_VALUES, 'personal'));
  const [materiaId, setMateriaId] = useState(event?.materiaId || '');
  const [description, setDescription] = useState(event?.description || '');
  const [completed, setCompleted] = useState(event?.completed || false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const safeTitle = sanitizeInput(title).slice(0, 150);
    if (!safeTitle) {
      setError('El título es obligatorio.');
      return;
    }
    if (!date) {
      setError('La fecha es obligatoria.');
      return;
    }
    if (startTime && endTime && endTime < startTime) {
      setError('La hora de fin no puede ser anterior a la hora de inicio.');
      return;
    }

    const safeType = validateEnum(type, EVENT_TYPE_VALUES, 'personal');

    onSave({
      title: safeTitle,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      type: safeType,
      materiaId: materiaId || null,
      description: sanitizeInput(description).slice(0, 500),
      completed: safeType === 'tarea' ? completed : false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-5 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-lg dark:shadow-soft-dark-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-light dark:text-text-dark text-sm">
            {isEditing ? 'Editar evento' : 'Nuevo evento'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-90 transition-all duration-150 ease-soft-out"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {isEditing && event?.source === 'grades' && (
          <div className="flex items-center gap-1.5 mb-4 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs">
            <Link2 size={12} className="shrink-0" />
            Sincronizado desde Calificaciones — puedes editarlo o eliminarlo libremente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              value={title}
              maxLength={150}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Parcial 1 de Cirugía"
              className={`${inputClass} w-full`}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} w-full [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
            <div className="col-span-1">
              <label className={labelClass}>Hora inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`${inputClass} w-full [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
            <div className="col-span-1">
              <label className={labelClass}>Hora fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${inputClass} w-full [color-scheme:light] dark:[color-scheme:dark]`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`${inputClass} w-full`}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Materia (opcional)</label>
              <select
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
                className={`${inputClass} w-full`}
              >
                <option value="">Sin materia</option>
                {MATERIAS.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {type === 'tarea' && (
            <Checkbox isSelected={completed} onChange={setCompleted} className="text-sm text-text-light dark:text-text-dark">
              Marcar como completada
            </Checkbox>
          )}

          <div>
            <label className={labelClass}>Descripción (opcional)</label>
            <textarea
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              className={`${inputClass} w-full resize-none`}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-[0.98] border border-rose-100 dark:border-rose-900/30 transition-all duration-150 ease-soft-out"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-textMuted-light dark:text-textMuted-dark hover:bg-slate-100 dark:hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-150 ease-soft-out"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white transition-all duration-150 ease-soft-out"
              >
                <Save size={14} />
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
