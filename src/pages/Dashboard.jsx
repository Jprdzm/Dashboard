import WelcomeBanner from '../components/WelcomeBanner';
import NotionLink from '../components/NotionLink';
import OneDriveLink from '../components/OneDriveLink';
import CalendarEmbed from '../components/CalendarEmbed';
import PomodoroTimer from '../components/PomodoroTimer';
import FinanceCard from '../components/FinanceCard';
import ProjectTracker from '../components/ProjectTracker';
import HabitTracker from '../components/HabitTracker';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <header className="flex justify-between items-start mb-8">
          <WelcomeBanner />
        </header>

        <main className="grid gap-6 md:gap-8">
          {/* Top row: Focus timer gets the wider column — it's the visual anchor of the home */}
          <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <FinanceCard />
            </div>
            <div className="md:col-span-3">
              <PomodoroTimer />
            </div>
          </div>

          {/* Middle row: Projects full width */}
          <ProjectTracker />

          {/* Habits row: full width */}
          <HabitTracker />

          {/* Links row: OneDrive and Notion side by side — secondary, so they stay compact */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OneDriveLink />
            <NotionLink />
          </div>

          {/* Bottom row: Calendar full width */}
          <CalendarEmbed />
        </main>
      </div>
    </div>
  );
}
