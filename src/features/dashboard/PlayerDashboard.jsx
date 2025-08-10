import React from 'react';
import { motion } from 'framer-motion';
import { DashboardHeader } from '../../components/layout';

const PlayerDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      <DashboardHeader title="Player Dashboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book a Turf</h3>
              <p className="text-gray-600 mb-4">Find and book available turfs in your area.</p>
              <button className="btn-primary w-full">Browse Turfs</button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Bookings</h3>
              <p className="text-gray-600 mb-4">View and manage your current bookings.</p>
              <button className="btn-primary w-full">View Bookings</button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Matches</h3>
              <p className="text-gray-600 mb-4">Find and join matches with other players.</p>
              <button className="btn-primary w-full">Find Matches</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlayerDashboard; 