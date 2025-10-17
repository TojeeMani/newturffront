import React from 'react';
import { useFestival } from '../../context/FestivalContext';

const FestivalBanner = () => {
  const { activeFestival, isFestivalActive } = useFestival();

  if (!isFestivalActive || !activeFestival) return null;

  const getFestivalEmoji = (festivalId) => {
    const emojis = {
      diwali: '🪔',
      christmas: '🎄',
      holi: '🎨',
      eid: '🌙'
    };
    return emojis[festivalId] || '🎉';
  };

  const getFestivalMessage = (festival) => {
    const messages = {
      diwali: `Happy Diwali! 🪔 Enjoy our special Diwali theme with festive colors and decorations!`,
      christmas: `Merry Christmas! 🎄 Enjoy our special Christmas theme with festive colors and decorations!`,
      holi: `Happy Holi! 🎨 Enjoy our special Holi theme with festive colors and decorations!`,
      eid: `Eid Mubarak! 🌙 Enjoy our special Eid theme with festive colors and decorations!`,
      newyear: `Happy New Year! 🎊 Enjoy our special New Year theme with festive colors and decorations!`
    };
    return messages[festival.id] || `Happy ${festival.name}! 🎉 Enjoy our special festival theme with festive colors and decorations!`;
  };

  return (
    <div className={`
      relative overflow-hidden rounded-lg mb-6 p-6 text-center
      bg-gradient-to-r from-${activeFestival.colors.primary.replace('#', '')}-50 to-${activeFestival.colors.secondary.replace('#', '')}-50
      dark:from-${activeFestival.colors.primary.replace('#', '')}-900 dark:to-${activeFestival.colors.secondary.replace('#', '')}-900
      border border-${activeFestival.colors.primary.replace('#', '')}-200 dark:border-${activeFestival.colors.primary.replace('#', '')}-700
    `}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {activeFestival.decorations.diyas && (
          <div className="absolute top-4 left-4 text-2xl festival-sparkle">🪔</div>
        )}
        {activeFestival.decorations.snowflakes && (
          <div className="absolute top-4 right-4 text-2xl festival-twinkle">❄</div>
        )}
        {activeFestival.decorations.colors && (
          <div className="absolute bottom-4 left-4 text-2xl festival-sparkle">🎨</div>
        )}
        {activeFestival.decorations.crescents && (
          <div className="absolute bottom-4 right-4 text-2xl festival-glow">🌙</div>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl festival-sparkle mr-3">
            {getFestivalEmoji(activeFestival.id)}
          </span>
          <h2 className="text-2xl font-bold festival-gradient-text">
            {activeFestival.name} Special
          </h2>
          <span className="text-4xl festival-sparkle ml-3">
            {getFestivalEmoji(activeFestival.id)}
          </span>
        </div>
        
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          {getFestivalMessage(activeFestival)}
        </p>
        
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 festival-glow"></span>
            Special Theme Active
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 festival-sparkle"></span>
            Festive Decorations
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-2 festival-twinkle"></span>
            Limited Time
          </span>
        </div>
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 rounded-full
              ${activeFestival.colors.accent}
              festival-sparkle
            `}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FestivalBanner;
