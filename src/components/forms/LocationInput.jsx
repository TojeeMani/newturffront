import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import locationService from '../../services/locationService';

const LocationInput = ({
  value,
  onChange,
  placeholder = "Enter your location",
  error,
  className = "",
  name = "location"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showPopular, setShowPopular] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Search locations using BookMyShow-style API
  const searchLocations = async (query) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowPopular(true);
      return;
    }

    setIsLoading(true);
    setShowPopular(false);

    try {
      const places = await locationService.searchLocationsForInput(query);
      setSuggestions(places);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    // Notify parent component of the change
    onChange(e);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      if (query.trim().length >= 1) {
        searchLocations(query.trim());
      } else {
        setSuggestions([]);
        setShowPopular(true);
      }
    }, 200); // Faster response time like BookMyShow

    setSearchTimeout(newTimeout);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    let selectedValue;

    if (typeof suggestion === 'string') {
      selectedValue = suggestion;
    } else if (suggestion && typeof suggestion === 'object') {
      selectedValue = suggestion.display || suggestion.name || suggestion.address || '';
    } else {
      selectedValue = '';
    }

    setSearchTerm(selectedValue);

    // Create a synthetic event object that matches what the parent expects
    const syntheticEvent = {
      target: {
        name: name,
        value: selectedValue
      }
    };

    onChange(syntheticEvent);
    setIsOpen(false);
    setSuggestions([]);
    setShowPopular(false);
  };

  // Handle current location detection
  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const locationResult = await locationService.getCurrentLocation();

      if (locationResult.success) {
        const { lat, lng } = locationResult.location;

        // Get address from coordinates
        const addressResult = await locationService.reverseGeocode(lat, lng);

        if (addressResult.success && addressResult.address) {
          const address = addressResult.address.formatted;
          setSearchTerm(address);

          // Create a synthetic event object
          const syntheticEvent = {
            target: {
              name: name,
              value: address
            }
          };

          onChange(syntheticEvent);
          setIsOpen(false);
          setShowPopular(false);
        } else {
          alert('Could not get address for your location');
        }
      } else {
        alert(locationResult.error || 'Could not get your location');
      }
    } catch (error) {
      console.error('Location detection error:', error);
      alert('Error detecting location. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    if (!searchTerm) {
      setShowPopular(true);
    } else if (searchTerm && suggestions.length === 0) {
      searchLocations(searchTerm);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay closing to allow suggestion clicks
    setTimeout(() => {
      setIsOpen(false);
      setShowPopular(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setShowPopular(false);
    }
  };

  // Clear input
  const handleClear = () => {
    setSearchTerm('');

    // Create a synthetic event object for clearing
    const syntheticEvent = {
      target: {
        name: name,
        value: ''
      }
    };

    onChange(syntheticEvent);
    setSuggestions([]);
    setShowPopular(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowPopular(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize search term from value
  useEffect(() => {
    if (value && value !== searchTerm) {
      // Handle different value types
      let displayValue = '';
      if (typeof value === 'string') {
        displayValue = value;
      } else if (typeof value === 'object' && value !== null) {
        displayValue = value.address || value.formatted || value.display || value.name || '';
      }

      if (displayValue && displayValue !== searchTerm) {
        setSearchTerm(displayValue);
      }
    }
  }, [value, searchTerm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Get popular cities for quick selection
  const popularCities = locationService.getPopularCities();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pl-12 pr-20 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
        />
        
        {/* Search Icon */}
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        
        {/* Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        
        {/* Location Detection Button */}
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isDetecting}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-primary-600 transition-colors disabled:opacity-50"
          title="Detect current location"
        >
          {isDetecting ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
          ) : (
            <MapPinIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || isLoading || showPopular) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Searching locations...</p>
              </div>
            ) : showPopular && popularCities.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                  Popular Cities
                </div>
                {popularCities.slice(0, 8).map((city, index) => (
                  <button
                    key={city.id || index}
                    type="button"
                    onClick={() => handleSuggestionSelect(city)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">{city.name}</span>
                          {city.type === 'metro' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Metro
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Popular
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{city.state}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id || index}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.name}
                          </p>
                          {suggestion.type === 'metro' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Metro
                            </span>
                          )}
                          {suggestion.popular && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {suggestion.display}
                        </p>
                        {suggestion.type === 'area' && suggestion.city && (
                          <p className="text-xs text-gray-400">
                            Area in {suggestion.city}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};

export default LocationInput;
