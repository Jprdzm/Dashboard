import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CalendarDays, CreditCard, PlaySquare } from 'lucide-react';
import supabase, { isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { enrichWithUser } from '../services/withUser';
import { sanitizeInput, safeParseFloat } from '../utils/sanitize';
import { useToast } from '../components/Toast';

const LOCALE = 'es-MX';
const CURRENCY = 'MXN';

function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(LOCALE, {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SuscripcionesPage() {
  const { user } = useAuth();
  const supabaseReady = isSupabaseConfigured;
  const addToast = useToast();

  const [subs, setSubs, isLoadingSubs] = useIndexedDB('suscripciones', []);

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [bank, setBank] = useState('');

  useEffect(() => {
    if (!supabaseReady || !user || isLoadingSubs) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('user_id', user.id);
        if (cancelled) return;
        if (error) {
          console.error('Error al obtener suscripciones:', error);
        } else if (data) {
          const mapped = data.map(d => ({
            id: d.id,
            name: d.nombre,
            cost: d.costo,
            renewalDate: d.fecha_renovacion,
            bank: d.banco_pago,
            renovado: d.renovado ?? false,
            ultimaRenovacion: d.ultima_renovacion,
          }));
          setSubs(mapped);
        }
      } catch (err) {
        if (!cancelled) console.error('Error:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [supabaseReady, user, setSubs, isLoadingSubs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !cost || !renewalDate) return;

    const safeName = sanitizeInput(name).slice(0, 100);
    const safeBank = sanitizeInput(bank).slice(0, 100);
    const target = safeParseFloat(cost);
    if (target <= 0) { addToast('El costo debe ser mayor a 0', 'warning'); return; }

    const newSub = {
      id: crypto.randomUUID(),
      name: safeName,
      cost: target,
      renewalDate,
      bank: safeBank,
      renovado: false,
      ultimaRenovacion: null,
    };

    setSubs((prev) => [...prev, newSub]);

    if (supabaseReady) {
      try {
        const { error } = await supabase
          .from('suscripciones')
          .insert([enrichWithUser({
            nombre: safeName,
            costo: target,
            fecha_renovacion: renewalDate,
            banco_pago: safeBank,
            renovado: false,
            ultima_renovacion: null,
          }, user)]);
        if (error) addToast('Error al sincronizar: ' + error.message, 'error');
        else addToast('Suscripción añadida correctamente', 'success');
      } catch (err) {
        addToast('Error al sincronizar: ' + err.message, 'error');
      }
    } else {
      addToast('Suscripción guardada localmente', 'success');
    }

    setName('');
    setCost('');
    setRenewalDate('');
    setBank('');
  };

  const handleDelete = async (id) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));

    if (supabaseReady) {
      try {
        const { error } = await supabase
          .from('suscripciones')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) console.error('Error al eliminar:', error);
      } catch (err) {
        console.error('Error inesperado al eliminar:', err);
      }
    }
  };

  const updateNextRenewalDate = async (id, currentRenewal) => {
    const current = new Date(currentRenewal);
    current.setMonth(current.getMonth() + 1);
    const nextRenewal = current.toISOString().split('T')[0];
    const now = new Date().toISOString();

    setSubs((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, renewalDate: nextRenewal, renovado: true, ultimaRenovacion: now }
          : s,
      ),
    );

    if (supabaseReady) {
      try {
        await supabase
          .from('suscripciones')
          .update({
            fecha_renovacion: nextRenewal,
            renovado: true,
            ultima_renovacion: now,
          })
          .eq('id', id)
          .eq('user_id', user.id);
        addToast('Suscripción renovada para el próximo mes', 'success');
      } catch (err) {
        console.error('Error actualizando suscripción:', err);
      }
    }
  };

  const totalMonthlyCost = useMemo(() => {
    return subs.reduce((sum, s) => sum + s.cost, 0);
  }, [subs]);

  const sortedSubs = useMemo(() => {
    return [...subs].sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  }, [subs]);

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Suscripciones
          </h1>
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <span className="text-xs font-medium uppercase tracking-wider opacity-80 block">
              Gasto Mensual
            </span>
            <span className="text-2xl font-bold">
              {formatCurrency(totalMonthlyCost)}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md mb-8">
          <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
            <PlaySquare size={16} className="text-indigo-500" />
            Nueva Suscripción
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Servicio (ej. Netflix)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Costo"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
            />
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
            />
            <input
              type="text"
              placeholder="Banco/Tarjeta (opcional)"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              Agregar
            </button>
          </form>
        </div>

        {/* Lista */}
        {sortedSubs.length === 0 ? (
          <div className="p-12 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-center">
            <PlaySquare size={32} className="mx-auto mb-3 text-textMuted-light dark:text-textMuted-dark" />
            <p className="text-textMuted-light dark:text-textMuted-dark">
              No tienes suscripciones registradas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSubs.map((sub) => {
              const days = daysUntil(sub.renewalDate);
              const isUrgent = days >= 0 && days <= 5;
              const isOverdue = days < 0;

              return (
                <div key={sub.id} className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md flex flex-col justify-between group">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg">{sub.name}</h3>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-1.5 rounded-md text-textMuted-light hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                      {formatCurrency(sub.cost)}
                    </p>
                    
                    <div className="space-y-2 text-sm text-textMuted-light dark:text-textMuted-dark">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} />
                        <span>Pago vía: {sub.bank || 'No especificado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} />
                        <span>Renueva: {formatDate(sub.renewalDate)}</span>
                      </div>
                      {sub.renovado && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          ✓ Renovada {sub.ultimaRenovacion ? formatDate(sub.ultimaRenovacion.split('T')[0]) : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`mt-5 p-3 rounded-lg flex items-center justify-between ${
                    isOverdue ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' :
                    isUrgent ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                    'bg-slate-50 dark:bg-white/5 text-text-light dark:text-text-dark'
                  }`}>
                    <span className="text-xs font-semibold">
                      {isOverdue ? `Venció hace ${Math.abs(days)} días` :
                       days === 0 ? '¡Se renueva HOY!' :
                       `Se renueva en ${days} días`}
                    </span>
                    <button 
                      onClick={() => updateNextRenewalDate(sub.id, sub.renewalDate)}
                      className="text-xs px-2 py-1 bg-white dark:bg-black/20 rounded shadow-sm hover:shadow transition-shadow"
                    >
                      Renovado
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
