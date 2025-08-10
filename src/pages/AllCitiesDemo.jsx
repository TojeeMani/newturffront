import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  GlobeAltIcon,
  ChartBarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AllCitiesDisplay from '../components/AllCitiesDisplay';

const AllCitiesDemo = () => {
  const [selectedCity, setSelectedCity] = useState(null);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <GlobeAltIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              All Indian Cities Database
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive database of Indian cities with real-time data from multiple APIs including 
            GeoNames, India Post, and static fallback data for complete coverage.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPinIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Metro Cities</p>
                <p className="text-2xl font-bold text-gray-900">40+</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Major Cities</p>
                <p className="text-2xl font-bold text-gray-900">100+</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <GlobeAltIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">All Cities</p>
                <p className="text-2xl font-bold text-gray-900">1000+</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <InformationCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Sources</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cities Display */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-lg shadow-sm p-6">
              <AllCitiesDisplay
                onCitySelect={handleCitySelect}
                showSearch={true}
                maxHeight="600px"
              />
            </div>
          </motion.div>

          {/* Selected City Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Selected City Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected City
              </h3>
              
              {selectedCity ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedCity.name}
                    </h4>
                    <p className="text-gray-600">{selectedCity.state}, India</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedCity.type === 'metro' ? 'bg-blue-100 text-blue-800' :
                        selectedCity.type === 'major' ? 'bg-green-100 text-green-800' :
                        selectedCity.type === 'city' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCity.type?.charAt(0).toUpperCase() + selectedCity.type?.slice(1)}
                      </span>
                    </div>

                    {selectedCity.population && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Population:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedCity.population.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {selectedCity.latitude && selectedCity.longitude && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Coordinates:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedCity.latitude.toFixed(4)}, {selectedCity.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {selectedCity.pincode && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pincode:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedCity.pincode}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Source:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {selectedCity.source}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>Full Address:</strong><br />
                      {selectedCity.address}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a city to view details</p>
                </div>
              )}
            </div>

            {/* API Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Data Sources
              </h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">GeoNames API</h4>
                  <p className="text-sm text-gray-600">
                    Comprehensive geographical database with population data and coordinates.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">India Post API</h4>
                  <p className="text-sm text-gray-600">
                    Official postal data with pincode information and administrative divisions.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-900">Static Fallback</h4>
                  <p className="text-sm text-gray-600">
                    Curated list of major Indian cities with population and classification data.
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Features
              </h3>
              
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time API data fetching</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Smart caching (24-hour cache)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Multiple data source integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Fallback for offline reliability</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Population-based classification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Advanced search and filtering</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AllCitiesDemo;
