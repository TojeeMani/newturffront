import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = ({ size = 'md', className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-12 h-6',
    md: 'w-14 h-7',
    lg: 'w-16 h-8'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        ${sizeClasses[size]}
        bg-gray-200 dark:bg-gray-700
        rounded-full
        transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        hover:bg-gray-300 dark:hover:bg-gray-600
        ${className}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Background Track */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-purple-600 dark:to-indigo-600 opacity-0 dark:opacity-100 transition-opacity duration-300" />
      
      {/* Toggle Circle */}
      <motion.div
        className={`
          absolute
          ${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-7 h-7'}
          bg-white dark:bg-gray-800
          rounded-full
          shadow-lg
          flex items-center justify-center
          border-2 border-gray-300 dark:border-gray-600
        `}
        animate={{
          x: isDarkMode 
            ? size === 'sm' ? 24 : size === 'md' ? 28 : 32
            : 2
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        {/* Icon */}
        <motion.div
          animate={{ rotate: isDarkMode ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isDarkMode ? (
            <MoonIcon className={`${iconSizes[size]} text-purple-600`} />
          ) : (
            <SunIcon className={`${iconSizes[size]} text-yellow-500`} />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
};

// Alternative compact version
export const CompactThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        animate={{ rotate: isDarkMode ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDarkMode ? (
          <MoonIcon className="w-5 h-5 text-purple-400" />
        ) : (
          <SunIcon className="w-5 h-5 text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
};

// Dropdown theme selector
export const ThemeSelector = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="
          appearance-none
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg
          px-4 py-2 pr-8
          text-sm
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-colors duration-200
        "
      >
        <option value="light">☀️ Light</option>
        <option value="dark">🌙 Dark</option>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default ThemeToggle;
