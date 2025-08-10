import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import locationService from '../../services/locationService';

const TurfLocationInput = ({
  value = {},
  onChange,
  placeholder = "Enter turf location",
  error,
  className = "",
  name = "location",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize search term from value
  useEffect(() => {
    if (value && value.address && value.address !== searchTerm) {
      setSearchTerm(value.address);
    }
  }, [value, searchTerm]);

  // Search locations
  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
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

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchLocations(query.trim());
      } else {
        setSuggestions([]);
      }
    }, 300);

    setSearchTimeout(newTimeout);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    try {
      // If suggestion has coordinates, use them directly
      if (suggestion.coordinates) {
        const locationData = {
          address: suggestion.display || suggestion.name,
          coordinates: suggestion.coordinates
        };

        // Validate and prepare for database
        const validatedData = locationService.prepareTurfLocationData(locationData);
        
        onChange({
          target: {
            name: name,
            value: validatedData
          }
        });
      } else {
        // If no coordinates, geocode the address
        const geocodeResult = await locationService.geocode(suggestion.display || suggestion.name);
        
        if (geocodeResult.success) {
          const locationData = {
            address: suggestion.display || suggestion.name,
            coordinates: geocodeResult.coordinates
          };

          const validatedData = locationService.prepareTurfLocationData(locationData);
          
          onChange({
            target: {
              name: name,
              value: validatedData
            }
          });
        } else {
          alert('Could not get coordinates for this location. Please try another location.');
        }
      }

      setSearchTerm(suggestion.display || suggestion.name);
      setIsOpen(false);
      setSuggestions([]);
    } catch (error) {
      console.error('Error selecting location:', error);
      alert('Error setting location. Please try again.');
    }
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
          const locationData = {
            address: addressResult.address.formatted,
            coordinates: { lat, lng }
          };

          const validatedData = locationService.prepareTurfLocationData(locationData);
          
          onChange({
            target: {
              name: name,
              value: validatedData
            }
          });

          setSearchTerm(addressResult.address.formatted);
          setIsOpen(false);
          setSuggestions([]);
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
    if (searchTerm && suggestions.length === 0) {
      searchLocations(searchTerm);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Clear input
  const handleClear = () => {
    setSearchTerm('');
    onChange({
      target: {
        name: name,
        value: {}
      }
    });
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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
          required={required}
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

      {/* Location Preview */}
      {value && value.address && value.coordinates && value.coordinates.lat && value.coordinates.lng && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPinIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{value.address}</p>
              <p className="text-xs text-green-600 mt-1">
                Coordinates: {value.coordinates?.lat?.toFixed(6) || 'N/A'}, {value.coordinates?.lng?.toFixed(6) || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || isLoading) && (
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
                          {suggestion.source === 'mapmyindia' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Premium
                            </span>
                          )}
                          {suggestion.type === 'city' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              City
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {suggestion.display}
                        </p>
                        {suggestion.coordinates && (
                          <p className="text-xs text-gray-400 mt-1">
                            📍 Coordinates available
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

export default TurfLocationInput;
