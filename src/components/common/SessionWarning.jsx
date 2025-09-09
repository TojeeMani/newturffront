import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SessionWarning = ({ isVisible, minutesLeft, onExtend, onLogout, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(minutesLeft * 60);

  useEffect(() => {
    if (!isVisible) return;

    setTimeLeft(minutesLeft * 60);
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, minutesLeft, onLogout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtend = async () => {
    onExtend();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
        >
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-4 mx-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Session Expiring Soon
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>Your session will expire in:</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <ClockIcon className="w-4 h-4" />
                    <span className="font-mono text-lg font-bold">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleExtend}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Extend Session
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Logout Now
                  </button>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={onDismiss}
                  className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-1.5 text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionWarning;
