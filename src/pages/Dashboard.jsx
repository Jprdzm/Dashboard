import React from 'react';
import WelcomeBanner from '../components/WelcomeBanner';
import NotionLink from '../components/NotionLink';
import CalendarEmbed from '../components/CalendarEmbed';
import PomodoroTimer from '../components/PomodoroTimer';
import FinanceCard from '../components/FinanceCard';
import ProjectTracker from '../components/ProjectTracker';

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <header className="flex justify-between items-start mb-10">
        <WelcomeBanner />
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FinanceCard />

        <PomodoroTimer />

        <NotionLink />

        <div className="md:col-span-2 lg:col-span-3">
          <ProjectTracker />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <CalendarEmbed />
        </div>
      </main>
    </div>
  );
}
