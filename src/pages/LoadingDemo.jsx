import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LoadingSpinner,
  FootballLoader,
  GrassLoader,
  DotsLoader,
  FullPageLoader,
  CardSkeleton,
  ButtonLoader,
  TableRowSkeleton,
  SearchLoader
} from '../components/ui/Loading';
import { useLoading } from '../context/LoadingContext';

const LoadingDemo = () => {
  const { showGlobalLoading, hideGlobalLoading } = useLoading();
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleGlobalLoading = (type) => {
    showGlobalLoading(`Testing ${type} loading...`, type);
    setTimeout(() => {
      hideGlobalLoading();
    }, 3000);
  };

  const handleButtonLoading = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TurfEase Loading Components
          </h1>
          <p className="text-lg text-gray-600">
            Custom loading animations designed for sports booking platform
          </p>
        </motion.div>

        {/* Spinner Variations */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Loading Spinners</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="mt-2 text-sm text-gray-600">Small</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-sm text-gray-600">Medium</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-gray-600">Large</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="mt-2 text-sm text-gray-600">Extra Large</p>
            </div>
          </div>
        </motion.section>

        {/* Sports-Themed Loaders */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sports-Themed Loaders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FootballLoader />
              <p className="mt-4 text-sm text-gray-600">Football Bouncing</p>
            </div>
            <div className="text-center">
              <GrassLoader />
              <p className="mt-4 text-sm text-gray-600">Grass Growing</p>
            </div>
            <div className="text-center">
              <DotsLoader />
              <p className="mt-4 text-sm text-gray-600">Dots Wave</p>
            </div>
          </div>
        </motion.section>

        {/* Button Loading States */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Button Loading States</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleButtonLoading}
              disabled={buttonLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {buttonLoading && <ButtonLoader size="sm" color="white" />}
              {buttonLoading ? 'Loading...' : 'Click to Load'}
            </button>
            
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg flex items-center">
              <ButtonLoader size="sm" color="white" />
              Creating Turf...
            </button>
            
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center">
              <ButtonLoader size="sm" color="white" />
              Uploading Images...
            </button>
          </div>
        </motion.section>

        {/* Global Loading Demos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Global Loading Overlays</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleGlobalLoading('football')}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Football Loading
            </button>
            <button
              onClick={() => handleGlobalLoading('grass')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Grass Loading
            </button>
            <button
              onClick={() => handleGlobalLoading('spinner')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Spinner Loading
            </button>
          </div>
        </motion.section>

        {/* Skeleton Loaders */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Skeleton Loaders</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mb-4">Card Skeletons</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>

          <h3 className="text-lg font-medium text-gray-800 mb-4">Table Skeletons</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
                <TableRowSkeleton columns={4} />
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Search Loading */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Search Loading</h2>
          <SearchLoader />
        </motion.section>
      </div>
    </div>
  );
};

export default LoadingDemo;
