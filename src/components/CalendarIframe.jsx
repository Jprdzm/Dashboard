import React from 'react';

export default function CalendarIframe() {
  return (
    <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <h2 className="font-semibold mb-3 text-text-light dark:text-text-dark">
        Calendario
      </h2>
      <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border-light dark:border-border-dark">
        <iframe
          src="https://calendar.google.com/calendar/embed?src=example%40gmail.com&ctz=America/Mexico_City"
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          title="Google Calendar"
        />
      </div>
    </div>
  );
}
