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
    <div className="min-h-screen bg-background dark:bg-background text-text-primary dark:text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <header className="flex justify-between items-start mb-8">
          <WelcomeBanner />
        </header>

        <main className="grid gap-6">
          {/* Top row: Finance and Pomodoro side by side */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FinanceCard className="card" />
            <PomodoroTimer className="card" />
          </div>

          {/* Middle row: Projects full width */}
          <ProjectTracker className="card" />

          {/* Habits row: full width */}
          <HabitTracker className="card" />

          {/* Links row: OneDrive and Notion side by side */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OneDriveLink className="card" />
            <NotionLink className="card" />
          </div>

          {/* Bottom row: Calendar full width */}
          <CalendarEmbed className="card" />
        </main>
      </div>
    </div>
  );
}
