import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-surface-light dark:hover:bg-surface-dark dark:hover:backdrop-blur-md transition-colors duration-200 text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="stroke-[1.5]" />
      ) : (
        <Moon size={20} className="stroke-[1.5]" />
      )}
    </button>
  );
}
