import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export default function OnlineStatus() {
  const [online, setOnline] = useState(isOnline());
  const [show, setShow] = useState(false);

  useEffect(() => {
    const goOnline = () => { setOnline(true); setShow(true); setTimeout(() => setShow(false), 3000); };
    const goOffline = () => { setOnline(false); setShow(true); };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 z-[100] flex items-center gap-2 px-3 py-2 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 ${
        online
          ? 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
          : 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
      }`}
    >
      {online ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span className="text-xs font-medium">
        {online ? 'Conectado' : 'Sin conexión'}
      </span>
      {online && <RefreshCw size={12} className="animate-spin" />}
    </div>
  );
}
