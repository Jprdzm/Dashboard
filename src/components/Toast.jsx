/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
  error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300',
  info: 'border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  warning: 'border-yellow-500/30 bg-yellow-50/90 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right ${COLORS[toast.type] || COLORS.info}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <p className="text-sm flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
