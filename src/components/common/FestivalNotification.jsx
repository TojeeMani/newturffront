import React, { useState, useEffect } from 'react';
import { useFestival } from '../../context/FestivalContext';

const FestivalNotification = () => {
  const { activeFestival, isFestivalActive } = useFestival();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isFestivalActive && activeFestival && !isDismissed) {
      setIsVisible(true);
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isFestivalActive, activeFestival, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Reset dismissal after 24 hours
    setTimeout(() => {
      setIsDismissed(false);
    }, 24 * 60 * 60 * 1000);
  };

  if (!isVisible || !activeFestival) return null;

  const getFestivalEmoji = (festivalId) => {
    const emojis = {
      diwali: '🪔',
      christmas: '🎄',
      holi: '🎨',
      eid: '🌙',
      newyear: '🎊',
      test: '🪔'
    };
    return emojis[festivalId] || '🎉';
  };

  const getFestivalMessage = (festival) => {
    const messages = {
      diwali: `Happy Diwali! 🪔 Enjoy our special Diwali theme with festive colors and decorations!`,
      christmas: `Merry Christmas! 🎄 Enjoy our special Christmas theme with festive colors and decorations!`,
      holi: `Happy Holi! 🎨 Enjoy our special Holi theme with festive colors and decorations!`,
      eid: `Eid Mubarak! 🌙 Enjoy our special Eid theme with festive colors and decorations!`,
      newyear: `Happy New Year! 🎊 Enjoy our special New Year theme with festive colors and decorations!`,
      test: `Happy Diwali! 🪔 Enjoy our special Diwali theme with festive colors and decorations!`
    };
    return messages[festival.id] || `Happy ${festival.name}! 🎉 Enjoy our special festival theme with festive colors and decorations!`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div 
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-500 ease-in-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          festival-gradient-text
        `}
        style={{
          borderLeftColor: activeFestival?.colors.primary || '#16a34a'
        }}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl festival-sparkle">
              {getFestivalEmoji(activeFestival.id)}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Festival Theme Active!
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {getFestivalMessage(activeFestival)}
            </p>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={handleDismiss}
                className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded transition-colors duration-200"
              >
                Dismiss
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-2 py-1 rounded transition-colors duration-200"
              >
                Refresh Theme
              </button>
            </div>
          </div>
          <div className="ml-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalNotification;
