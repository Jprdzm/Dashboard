import { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import supabase from '../services/supabaseClient';
import { Check, Edit2, X } from 'lucide-react';

export default function WelcomeBanner() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const userMetadataName = user?.user_metadata?.username;
  const emailName = user?.email
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
    : 'Usuario';
  const displayName = userMetadataName || emailName;

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = new Intl.DateTimeFormat('es-ES', dateOptions).format(new Date());
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handleSave = async () => {
    if (!newName.trim() || newName.trim() === displayName) {
      setIsEditing(false);
      return;
    }
    try {
      await supabase.auth.updateUser({
        data: { username: newName.trim() }
      });
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error('Error actualizando usuario', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-text-light dark:text-text-dark">
              Bienvenido,
            </h1>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="px-2 py-1 font-heading text-xl font-bold rounded-lg border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-light/40 dark:focus:ring-accent-dark/40 w-48"
            />
            <button onClick={handleSave} className="p-1.5 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-200 ease-soft-out active:scale-[0.95]" aria-label="Guardar nombre">
              <Check size={18} />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-md text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-white/[0.06] transition-colors duration-200 ease-soft-out active:scale-[0.95]" aria-label="Cancelar edición">
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setIsEditing(true); setNewName(displayName); }}>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-text-light dark:text-text-dark">
              Bienvenido, <span className="text-accent-light dark:text-accent-dark">{displayName}</span>
            </h1>
            <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-textMuted-light dark:text-textMuted-dark hover:bg-bg-light dark:hover:bg-white/10 transition-all duration-200 ease-soft-out" aria-label="Editar nombre">
              <Edit2 size={16} />
            </button>
          </div>
        )}
      </div>
      <p className="flex items-center gap-2 text-sm font-medium text-textMuted-light dark:text-textMuted-dark">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-light dark:bg-accent-dark" aria-hidden="true" />
        {displayDate}
      </p>
    </div>
  );
}
