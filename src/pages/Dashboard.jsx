import WelcomeBanner from '../components/WelcomeBanner';
import NotionLink from '../components/NotionLink';
import OneDriveLink from '../components/OneDriveLink';
import PomodoroTimer from '../components/PomodoroTimer';
import FinanceCard from '../components/FinanceCard';
import HabitTracker from '../components/HabitTracker';
import UpcomingEventsWidget from '../components/UpcomingEventsWidget';
import PendingTasksWidget from '../components/PendingTasksWidget';
import SemesterAverageWidget from '../components/SemesterAverageWidget';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <header className="flex justify-between items-start mb-10 md:mb-14">
          <WelcomeBanner />
        </header>

        <main className="grid gap-10 md:gap-14">
          {/* Summary widgets as a CSS-columns masonry, not a row-based grid:
              a normal grid stretches every card in a row to the tallest
              one's height, which is exactly what kept leaving blank gaps as
              content changed (FinanceCard grew, Calificaciones went from one
              number to a per-materia list, Pendientes got added). Columns
              flow each card at its own natural height and pack the next one
              right below it, so the layout self-balances regardless of how
              tall any single card is. `break-inside-avoid` keeps each card
              intact instead of splitting across columns. Gap is a touch
              larger than the section rhythm below so the bigger rounded-3xl
              cards get room to breathe without touching. */}
          <div className="columns-1 md:columns-2 xl:columns-3 gap-5 md:gap-7 [&>*]:mb-5 md:[&>*]:mb-7 [&>*]:break-inside-avoid">
            <PomodoroTimer />
            <FinanceCard />
            <UpcomingEventsWidget />
            <PendingTasksWidget />
            <SemesterAverageWidget />
          </div>

          {/* Habits row: full width */}
          <HabitTracker />

          {/* Links row: OneDrive and Notion side by side — secondary, so they stay compact */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <OneDriveLink />
            <NotionLink />
          </div>
        </main>
      </div>
    </div>
  );
}
