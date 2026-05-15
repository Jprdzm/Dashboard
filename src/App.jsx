import React from 'react';
import ThemeToggle from './components/ThemeToggle';
import WelcomeBanner from './components/WelcomeBanner';
import NotionLink from './components/NotionLink';
import CalendarIframe from './components/CalendarIframe';
import PomodoroTimer from './components/PomodoroTimer';
import FinanceTracker from './components/FinanceTracker';

function App() {
  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark transition-colors duration-300">
      {/* Notion style layout: centered max-width container */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        
        {/* Top Header */}
        <header className="flex justify-between items-start mb-10">
          <WelcomeBanner />
          <div className="mt-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Dashboard Grid Content */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Example Grid Cards */}
          <FinanceTracker />
          
          <PomodoroTimer />
          
          <NotionLink />
          
          <div className="md:col-span-2 lg:col-span-3">
            <CalendarIframe />
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;
