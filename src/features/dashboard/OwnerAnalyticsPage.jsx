import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboardNav } from '../../components/layout';

const OwnerAnalyticsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <OwnerDashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analytics
            </h1>
            <p className="text-gray-600">
              Track your business performance and gain insights into your turf operations.
            </p>
          </div>

          {/* Placeholder Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive analytics and insights for your turf business are currently under development.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-green-800 text-sm">
                  <strong>Analytics features coming soon:</strong>
                </p>
                <ul className="text-green-700 text-sm mt-2 space-y-1">
                  <li>• Revenue tracking and trends</li>
                  <li>• Booking statistics</li>
                  <li>• Customer insights</li>
                  <li>• Performance metrics</li>
                  <li>• Seasonal analysis</li>
                  <li>• Popular time slots</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerAnalyticsPage;
