import React from 'react';
import { motion } from 'framer-motion';

// Main Loading Spinner with Football Animation
export const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600'
  };

  return (
    <div className={`inline-block ${className}`}>
      <motion.div
        className={`${sizes[size]} ${colors[color]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </motion.div>
    </div>
  );
};

// Football Bouncing Animation
export const FootballLoader = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full relative shadow-lg"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Football lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-1 bg-white rounded-full"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center rotate-45">
          <div className="w-6 h-0.5 bg-white rounded-full"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center -rotate-45">
          <div className="w-6 h-0.5 bg-white rounded-full"></div>
        </div>
      </motion.div>
    </div>
  );
};

// Grass Growing Animation
export const GrassLoader = ({ className = '' }) => {
  return (
    <div className={`flex items-end justify-center space-x-1 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-green-600 to-green-400 rounded-t-full"
          animate={{
            height: [8, 24, 8]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Dots Wave Animation
export const DotsLoader = ({ color = 'primary', className = '' }) => {
  const colorClasses = {
    primary: 'bg-primary-600',
    white: 'bg-white',
    gray: 'bg-gray-600',
    green: 'bg-green-600'
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-3 h-3 rounded-full ${colorClasses[color]}`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Full Page Loading Screen
export const FullPageLoader = ({ message = 'Loading...', type = 'football' }) => {
  const renderLoader = () => {
    switch (type) {
      case 'football':
        return <FootballLoader />;
      case 'grass':
        return <GrassLoader />;
      case 'spinner':
        return <LoadingSpinner size="xl" />;
      default:
        return <FootballLoader />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center z-50">
      <div className="text-center">
        {renderLoader()}
        <motion.p
          className="mt-6 text-lg font-medium text-gray-700"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
        
        {/* TurfEase Logo/Text */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-primary-600">TurfEase</h2>
          <p className="text-sm text-gray-500 mt-1">Your Sports Booking Platform</p>
        </motion.div>
      </div>
    </div>
  );
};

// Card Loading Skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden animate-pulse ${className}`}>
      <div className="w-full h-48 bg-gray-300"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
        <div className="h-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

// Button Loading State
export const ButtonLoader = ({ size = 'sm', color = 'white' }) => {
  return (
    <LoadingSpinner size={size} color={color} className="mr-2" />
  );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="animate-pulse">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-300 rounded"></div>
        </td>
      ))}
    </tr>
  );
};

// Search Loading
export const SearchLoader = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="text-center">
        <motion.div
          className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-2 text-sm text-gray-600">Searching turfs...</p>
      </div>
    </div>
  );
};

export default {
  LoadingSpinner,
  FootballLoader,
  GrassLoader,
  DotsLoader,
  FullPageLoader,
  CardSkeleton,
  ButtonLoader,
  TableRowSkeleton,
  SearchLoader
};
