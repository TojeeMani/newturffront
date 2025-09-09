/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'slide-in-from-bottom': 'slideInFromBottom 0.3s ease-out',
        'slide-in-from-bottom-2': 'slideInFromBottom2 0.3s ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromBottom2: {
          '0%': { transform: 'translateY(20px)', opacity: '0', scale: '0.95' },
          '100%': { transform: 'translateY(0)', opacity: '1', scale: '1' },
        }
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-300': {
          'scrollbar-color': '#d1d5db transparent',
        },
        '.dark .scrollbar-thumb-gray-600': {
          'scrollbar-color': '#4b5563 transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb': {
          'background-color': '#d1d5db',
          'border-radius': '3px',
        },
        '.dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb': {
          'background-color': '#4b5563',
          'border-radius': '3px',
        },
        '.animate-in': {
          'animation-fill-mode': 'both',
        },
        '.fade-in': {
          'animation-name': 'fadeIn',
          'animation-duration': '0.3s',
          'animation-timing-function': 'ease-out',
        },
        '.duration-300': {
          'animation-duration': '0.3s',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}