import React from 'react';

const CALENDAR_URL =
  'https://calendar.google.com/calendar/embed?src=example%40gmail.com&ctz=America/Mexico_City';

export default function CalendarEmbed() {
  return (
    <div className="p-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-colors duration-300 hover:shadow-sm">
      <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark">
        Calendario
      </h2>
      <div className="relative w-full h-[450px] max-h-[60vh] overflow-hidden rounded-lg border border-border-light dark:border-border-dark dark:invert-[0.9] dark:hue-rotate-180">
        <iframe
          src={CALENDAR_URL}
          className="absolute top-0 left-0 w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          title="Google Calendar"
        />
      </div>
    </div>
  );
}
