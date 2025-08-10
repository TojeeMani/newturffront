import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import locationService from '../services/locationService';

const AllCitiesDisplay = ({ onCitySelect, showSearch = true, maxHeight = '400px' }) => {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Load all cities on component mount
  useEffect(() => {
    loadAllCities();
  }, []);

  // Filter and sort cities when search term or filter changes
  useEffect(() => {
    filterAndSortCities();
  }, [cities, searchTerm, selectedFilter, sortBy]);

  const loadAllCities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await locationService.getAllIndianCities();
      
      if (result.success) {
        setCities(result.cities);
        console.log(`Loaded ${result.cities.length} cities from India`);
      } else {
        setError(result.error || 'Failed to load cities');
        // Use fallback static data
        const fallbackCities = locationService.getStaticCitiesFallback();
        setCities(fallbackCities);
      }
    } catch (err) {
      console.error('Error loading cities:', err);
      setError(err.message);
      // Use fallback static data
      const fallbackCities = locationService.getStaticCitiesFallback();
      setCities(fallbackCities);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCities = () => {
    let filtered = [...cities];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(city => 
        city.name.toLowerCase().includes(searchLower) ||
        city.state.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(city => city.type === selectedFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'state':
          return a.state.localeCompare(b.state) || a.name.localeCompare(b.name);
        case 'population':
          return (b.population || 0) - (a.population || 0);
        case 'type':
          const typeOrder = { metro: 0, major: 1, city: 2, town: 3 };
          return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4) || a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredCities(filtered);
  };

  const handleCityClick = (city) => {
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  const getCityTypeColor = (type) => {
    switch (type) {
      case 'metro': return 'bg-blue-100 text-blue-800';
      case 'major': return 'bg-green-100 text-green-800';
      case 'city': return 'bg-yellow-100 text-yellow-800';
      case 'town': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCityTypeLabel = (type) => {
    switch (type) {
      case 'metro': return 'Metro';
      case 'major': return 'Major';
      case 'city': return 'City';
      case 'town': return 'Town';
      default: return 'City';
    }
  };

  const formatPopulation = (population) => {
    if (!population) return '';
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    }
    if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin" />
        <p className="text-sm text-gray-600">Loading all Indian cities...</p>
        <p className="text-xs text-gray-500">This may take a moment</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            All Indian Cities ({filteredCities.length})
          </h3>
          <button
            onClick={loadAllCities}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh cities"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                {error} - Showing fallback data
              </p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {showSearch && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cities or states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {/* Type Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="metro">Metro Cities</option>
                <option value="major">Major Cities</option>
                <option value="city">Cities</option>
                <option value="town">Towns</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="name">Sort by Name</option>
                <option value="state">Sort by State</option>
                <option value="population">Sort by Population</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Cities List */}
      <div 
        className="overflow-y-auto border border-gray-200 rounded-lg"
        style={{ maxHeight }}
      >
        {filteredCities.length === 0 ? (
          <div className="p-8 text-center">
            <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No cities found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredCities.map((city, index) => (
                <motion.button
                  key={city.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleCityClick(city)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {city.name}
                          </p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getCityTypeColor(city.type)}`}>
                            {getCityTypeLabel(city.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {city.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {city.population && (
                        <p className="text-xs text-gray-500">
                          {formatPopulation(city.population)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {city.source}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing {filteredCities.length} of {cities.length} cities
        {cities.length > 0 && (
          <span className="ml-2">
            • {cities.filter(c => c.type === 'metro').length} Metro
            • {cities.filter(c => c.type === 'major').length} Major
            • {cities.filter(c => c.type === 'city').length} Cities
            • {cities.filter(c => c.type === 'town').length} Towns
          </span>
        )}
      </div>
    </div>
  );
};

export default AllCitiesDisplay;
