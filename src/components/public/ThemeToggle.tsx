import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'button';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'pill' }) => {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  if (variant === 'button') {
    return (
      <button
        id="theme-toggle-single-btn"
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
        title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
        className={`p-2 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-[#07170e] border-[#143020] text-[#10b981] hover:text-white hover:border-[#10b981]'
            : 'bg-[#edf3ee] border-[#cedfd3] text-[#059669] hover:text-[#09120b] hover:border-[#059669]'
        } ${className}`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  // Dual segmented pill matching the language switcher
  return (
    <div
      id="theme-switcher"
      role="radiogroup"
      aria-label="Theme selection"
      className={`flex items-center rounded-full p-0.5 border text-xs transition-colors duration-200 ${
        isDark
          ? 'bg-[#07170e] border-[#143020]'
          : 'bg-[#edf3ee] border-[#cedfd3]'
      } ${className}`}
    >
      <button
        id="theme-btn-dark"
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme('dark')}
        aria-label="Dark Mode"
        title="Dark Mode"
        className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 rounded-full transition-all duration-200 cursor-pointer ${
          isDark
            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'text-[#6b8274] hover:text-[#121c15]'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline-block ml-1 text-[11px] font-mono uppercase tracking-wider">
          Dark
        </span>
      </button>

      <button
        id="theme-btn-light"
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme('light')}
        aria-label="Light Mode"
        title="Light Mode"
        className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 rounded-full transition-all duration-200 cursor-pointer ${
          !isDark
            ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold shadow-sm'
            : 'text-[#7d9987] hover:text-[#c4ded0]'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline-block ml-1 text-[11px] font-mono uppercase tracking-wider">
          Light
        </span>
      </button>
    </div>
  );
};
