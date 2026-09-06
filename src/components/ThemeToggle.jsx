import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-lg overflow-hidden hover:bg-surface-light dark:hover:bg-surface-dark dark:hover:backdrop-blur-md active:scale-[0.95] transition-all duration-200 ease-soft-out text-textMuted-light dark:text-textMuted-dark hover:text-text-light dark:hover:text-text-dark"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <span className="relative grid place-items-center w-5 h-5">
        <Sun
          size={20}
          className={`col-start-1 row-start-1 stroke-[1.5] transition-all duration-200 ease-soft-out ${
            theme === 'dark' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
          }`}
        />
        <Moon
          size={20}
          className={`col-start-1 row-start-1 stroke-[1.5] transition-all duration-200 ease-soft-out ${
            theme === 'dark' ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
          }`}
        />
      </span>
    </button>
  );
}
