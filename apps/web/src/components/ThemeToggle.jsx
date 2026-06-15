import React from 'react';
import { LuSun, LuMoon } from 'react-icons/lu';
import { useTheme } from '../context/ThemeContext';

/**
 * Sun/Moon theme toggle. `variant="ghost"` for placing on colored backgrounds.
 */
const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${className}`}
      style={{
        background: 'var(--accent-dim)',
        color: 'var(--accent-text)',
      }}
    >
      {isDark ? <LuSun className="w-4 h-4" /> : <LuMoon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;
