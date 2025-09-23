import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navigation } from '../../components/layout';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Book a Turf</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Find and book available turfs in your area.</p>
              <button className="btn-primary w-full">Browse Turfs</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Bookings</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">View and manage your current bookings.</p>
              <button className="btn-primary w-full" onClick={() => navigate('/bookings/my')}>View Bookings</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Matches</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Live, upcoming and completed matches from your bookings.</p>
              <button className="btn-primary w-full" onClick={() => navigate('/matches/my')}>View My Matches</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerDashboard; 