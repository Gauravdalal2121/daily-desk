import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full hover:bg-surface-variant/50 dark:hover:bg-surface-darkVariant/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 active:scale-95 duration-200"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'light' ? (
        <Moon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      ) : (
        <Sun className="w-6 h-6 text-yellow-400" />
      )}
    </button>
  );
};

export default ThemeToggle;