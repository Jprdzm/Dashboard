const CALENDAR_ID =
  '13ab01b6d9ffafecd1ee08499d1368b97bc8790f94d72e3f80aa062e394fe599%40group.calendar.google.com';

const CALENDAR_URL =
  `https://calendar.google.com/calendar/embed?src=${CALENDAR_ID}` +
  `&ctz=America%2FMexico_City` +
  `&mode=AGENDA` +
  `&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0`;

export default function CalendarEmbed() {
  return (
    <div className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark dark:backdrop-blur-md shadow-soft-sm dark:shadow-soft-dark-sm hover:shadow-soft-md dark:hover:shadow-soft-dark-md transition-all duration-300 ease-soft-out">
      <h2 className="font-semibold mb-4 text-text-light dark:text-text-dark">
        Calendario
      </h2>
      <div className="w-full h-[400px] sm:h-[450px] rounded-xl overflow-hidden shadow-soft-sm border border-border-light dark:border-white/[0.06] dark:invert-[0.9] dark:hue-rotate-180">
        <iframe
          src={CALENDAR_URL}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          title="Google Calendar"
        />
      </div>
    </div>
  );
}
