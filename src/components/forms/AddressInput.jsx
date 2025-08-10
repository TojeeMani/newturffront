import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import locationService from '../../services/locationService';
import { showErrorToast, showWarningToast } from '../../utils/toast';

// Fallback to India Post API if MapMyIndia is not available
const INDIA_POST_API_BASE = 'https://api.postalpincode.in';

const AddressInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter your business address",
  error,
  required = false,
  className = "",
  name = "businessAddress",
  rows = 3
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-detect location using browser geolocation
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      showErrorToast('Geolocation is not supported by this browser.');
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try reverse geocoding first
          const geocodeResult = await locationService.reverseGeocode(latitude, longitude);

          if (geocodeResult.success && geocodeResult.address) {
            const detectedAddress = geocodeResult.address.formatted;

            if (detectedAddress) {
              onChange({
                target: {
                  name: name,
                  value: detectedAddress
                }
              });
              return;
            }
          }
          
          // Fallback to BigDataCloud if MapMyIndia fails
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // Construct a readable address
            const addressParts = [];
            if (data.locality) addressParts.push(data.locality);
            if (data.city && data.city !== data.locality) addressParts.push(data.city);
            if (data.principalSubdivision) addressParts.push(data.principalSubdivision);
            if (data.countryName) addressParts.push(data.countryName);
            
            const fullAddress = addressParts.join(', ');
            
            if (fullAddress) {
              onChange({
                target: {
                  name: name,
                  value: fullAddress
                }
              });
            } else {
              showWarningToast('Could not determine your address. Please enter manually.');
            }
          } else {
            throw new Error('Failed to get location data');
          }
        } catch (error) {
          console.error('Error getting location:', error);
          showErrorToast('Failed to detect location. Please enter manually.');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = 'Failed to detect location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
          default:
            message += 'Please enter manually.';
            break;
        }

        showErrorToast(message);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Search for address suggestions using India Post API
  const searchAddresses = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      // Search by pincode if query is numeric
      const isNumeric = /^\d+$/.test(query);
      const endpoint = isNumeric ? 'pincode' : 'postoffice';

      const response = await fetch(
        `${INDIA_POST_API_BASE}/${endpoint}/${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
          const formattedSuggestions = data[0].PostOffice.map(office => ({
            id: `${office.Name}-${office.Pincode}`,
            display_name: `${office.Name}, ${office.District}, ${office.State} - ${office.Pincode}`,
            formatted: office.Name,
            office_name: office.Name,
            district: office.District,
            state: office.State,
            pincode: office.Pincode,
            division: office.Division,
            region: office.Region
          }));

          // Remove duplicates and limit results
          const uniqueSuggestions = formattedSuggestions
            .filter((suggestion, index, self) =>
              index === self.findIndex(s => s.id === suggestion.id)
            )
            .slice(0, 8);

          setSuggestions(uniqueSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
    }
  };



  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      searchAddresses(newValue);
    }, 500); // 500ms delay

    setSearchTimeout(timeout);
  };

  const handleSuggestionSelect = (suggestion) => {
    onChange({
      target: {
        name: name,
        value: suggestion.display_name
      }
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const clearInput = () => {
    onChange({
      target: {
        name: name,
        value: ''
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          rows={rows}
          className={`block w-full px-3 py-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder={placeholder}
          required={required}
        />
        
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear address"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            className="p-1 text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
            title="Detect my location"
          >
            {isDetecting ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
            ) : (
              <MapPinIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-200 bg-orange-50">
              <div className="flex items-center text-xs text-orange-600 font-medium">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                India Post - Official Address Database
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id || index}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900 font-medium">
                          {suggestion.office_name}
                        </div>
                        <div className="text-xs text-orange-600 font-mono bg-orange-100 px-2 py-0.5 rounded">
                          {suggestion.pincode}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {suggestion.district}, {suggestion.state}
                      </div>
                      {suggestion.division && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Division: {suggestion.division}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressInput;
