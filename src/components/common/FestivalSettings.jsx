import React from 'react';
import { useFestival } from '../../context/FestivalContext';

const FestivalSettings = () => {
  const { activeFestival, isFestivalActive, getUpcomingFestivals, festivals } = useFestival();
  const upcomingFestivals = getUpcomingFestivals();

  const getFestivalEmoji = (festivalId) => {
    const emojis = {
      diwali: '🪔',
      christmas: '🎄',
      holi: '🎨',
      eid: '🌙',
      newyear: '🎊'
    };
    return emojis[festivalId] || '🎉';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilFestival = (actualDate) => {
    const today = new Date();
    const festivalDate = new Date(actualDate);
    const diffTime = festivalDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFestivalThemePeriod = (actualDate) => {
    const actual = new Date(actualDate);
    const startDate = new Date(actual);
    startDate.setDate(actual.getDate() - 3);
    const endDate = new Date(actual);
    endDate.setDate(actual.getDate() + 3);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  return (
    <div className="space-y-6">
      {/* Current Festival Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Festival Theme Status
        </h3>
        
        {isFestivalActive && activeFestival ? (
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
            <span className="text-3xl festival-sparkle">
              {getFestivalEmoji(activeFestival.id)}
            </span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {activeFestival.name} Theme Active
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Special theme running from {formatDate(getFestivalThemePeriod(activeFestival.actualDate).start)} to {formatDate(getFestivalThemePeriod(activeFestival.actualDate).end)}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 festival-glow"></span>
                  Active
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Ends in {getDaysUntilFestival(getFestivalThemePeriod(activeFestival.actualDate).end)} days
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-3xl text-gray-400">🎨</span>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                No Festival Theme Active
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Check out upcoming festivals below
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Festivals */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Festivals
        </h3>
        
        {upcomingFestivals.length > 0 ? (
          <div className="space-y-4">
            {upcomingFestivals.map((festival) => (
              <div
                key={festival.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">
                    {getFestivalEmoji(festival.id)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {festival.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Theme runs from {formatDate(getFestivalThemePeriod(festival.actualDate).start)} to {formatDate(getFestivalThemePeriod(festival.actualDate).end)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Actual festival: {formatDate(festival.actualDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {getDaysUntilFestival(getFestivalThemePeriod(festival.actualDate).start)} days
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    until theme starts
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <span className="text-4xl mb-2 block">📅</span>
            <p>No upcoming festivals scheduled</p>
          </div>
        )}
      </div>

      {/* All Festivals List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Festival Themes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {festivals.map((festival) => (
            <div
              key={festival.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                activeFestival?.id === festival.id
                  ? 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">
                  {getFestivalEmoji(festival.id)}
                </span>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {festival.name}
                </h4>
                {activeFestival?.id === festival.id && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Active
                  </span>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>Theme Period: {formatDate(getFestivalThemePeriod(festival.actualDate).start)} - {formatDate(getFestivalThemePeriod(festival.actualDate).end)}</p>
                <p>Festival Date: {formatDate(festival.actualDate)}</p>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {festival.decorations.diyas && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    🪔 Diyas
                  </span>
                )}
                {festival.decorations.snowflakes && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    ❄ Snow
                  </span>
                )}
                {festival.decorations.colors && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400">
                    🎨 Colors
                  </span>
                )}
                {festival.decorations.crescents && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    🌙 Crescents
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start space-x-3">
          <span className="text-blue-500 text-xl">ℹ️</span>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How Festival Themes Work</p>
            <ul className="space-y-1 text-xs">
              <li>• Festival themes automatically activate 3 days before the actual festival</li>
              <li>• Themes include special colors, decorations, and animations</li>
              <li>• Themes automatically deactivate 3 days after the festival ends</li>
              <li>• You can refresh the page to see theme changes immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalSettings;
