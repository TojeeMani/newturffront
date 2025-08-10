import { MapMyIndiaAPI } from '../config/mapmyindia';

// India Post API configuration (Free API - no key required)
const INDIA_POST_API_BASE = 'https://api.postalpincode.in';

class LocationService {
  constructor() {
    this.isMapMyIndiaAvailable = process.env.REACT_APP_MAPMYINDIA_API_KEY && 
                                 process.env.REACT_APP_MAPMYINDIA_API_KEY !== 'YOUR_MAPMYINDIA_API_KEY';
  }

  // Search for locations with autocomplete
  async searchLocations(query, options = {}) {
    const results = {
      mapMyIndia: [],
      indiaPost: [],
      success: false,
      error: null
    };

    try {
      // Try MapMyIndia first if available
      if (this.isMapMyIndiaAvailable) {
        try {
          const mapMyIndiaResults = await MapMyIndiaAPI.searchLocations(query, {
            maxResults: 8,
            ...options
          });

          results.mapMyIndia = mapMyIndiaResults.map(location => ({
            id: location.placeId || location.place_id,
            name: location.placeName || location.place_name,
            type: location.placeType || location.place_type,
            state: location.state,
            district: location.district,
            city: location.city,
            display: location.placeName || location.place_name,
            coordinates: location.coordinates || location.latLng,
            address: location.address || location.formatted_address,
            source: 'mapmyindia'
          }));
        } catch (error) {
          console.error('MapMyIndia search error:', error);
        }
      }

      // Fallback to India Post API
      try {
        const indiaPostResults = await this.searchIndiaPostAPI(query);
        results.indiaPost = indiaPostResults.map(location => ({
          ...location,
          source: 'indiapost'
        }));
      } catch (error) {
        console.error('India Post search error:', error);
      }

      results.success = results.mapMyIndia.length > 0 || results.indiaPost.length > 0;
      return results;

    } catch (error) {
      results.error = error.message;
      return results;
    }
  }

  // Search India Post API for location suggestions
  async searchIndiaPostAPI(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(
        `${INDIA_POST_API_BASE}/postoffice/${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
          const uniqueLocations = new Map();

          data[0].PostOffice.forEach(office => {
            const cityKey = `${office.District}-${office.State}`;

            // Add city
            if (office.District && !uniqueLocations.has(cityKey)) {
              uniqueLocations.set(cityKey, {
                id: cityKey,
                name: office.District,
                type: 'city',
                state: office.State,
                display: `${office.District}, ${office.State}`,
                pincode: office.Pincode
              });
            }

            // Add specific area if different from district
            if (office.Name && office.Name !== office.District) {
              const areaKey = `${office.Name}-${office.District}-${office.State}`;
              if (!uniqueLocations.has(areaKey)) {
                uniqueLocations.set(areaKey, {
                  id: areaKey,
                  name: office.Name,
                  type: 'area',
                  district: office.District,
                  state: office.State,
                  display: `${office.Name}, ${office.District}, ${office.State}`,
                  pincode: office.Pincode
                });
              }
            }
          });

          return Array.from(uniqueLocations.values())
            .sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === 'city' ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            })
            .slice(0, 10);
        }
      }
    } catch (error) {
      console.error('Error fetching India Post data:', error);
    }

    return [];
  }

  // Reverse geocoding - convert coordinates to address
  async reverseGeocode(latitude, longitude) {
    const result = {
      success: false,
      address: null,
      coordinates: { lat: latitude, lng: longitude },
      error: null
    };

    try {
      // Try MapMyIndia first if available
      if (this.isMapMyIndiaAvailable) {
        try {
          const mapMyIndiaData = await MapMyIndiaAPI.reverseGeocode(latitude, longitude);
          
          if (mapMyIndiaData && mapMyIndiaData.results && mapMyIndiaData.results.length > 0) {
            const location = mapMyIndiaData.results[0];
            
            result.address = {
              formatted: this.formatMapMyIndiaAddress(location),
              components: {
                locality: location.locality,
                city: location.city,
                state: location.principalSubdivision,
                country: location.country,
                pincode: location.pincode
              },
              source: 'mapmyindia'
            };
            
            result.success = true;
            return result;
          }
        } catch (error) {
          console.error('MapMyIndia reverse geocode error:', error);
        }
      }

      // Fallback to BigDataCloud
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          result.address = {
            formatted: this.formatBigDataCloudAddress(data),
            components: {
              locality: data.locality,
              city: data.city,
              state: data.principalSubdivision,
              country: data.countryName,
              pincode: data.postcode
            },
            source: 'bigdatacloud'
          };
          
          result.success = true;
          return result;
        }
      } catch (error) {
        console.error('BigDataCloud reverse geocode error:', error);
      }

      result.error = 'Could not determine address from coordinates';
      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  // Geocoding - convert address to coordinates
  async geocode(address) {
    const result = {
      success: false,
      coordinates: null,
      address: null,
      error: null
    };

    try {
      // Try MapMyIndia first if available
      if (this.isMapMyIndiaAvailable) {
        try {
          const mapMyIndiaData = await MapMyIndiaAPI.geocode(address);
          
          if (mapMyIndiaData && mapMyIndiaData.results && mapMyIndiaData.results.length > 0) {
            const location = mapMyIndiaData.results[0];
            
            result.coordinates = {
              lat: location.lat || location.latitude,
              lng: location.lng || location.longitude
            };
            
            result.address = {
              formatted: location.formatted_address || address,
              components: {
                locality: location.locality,
                city: location.city,
                state: location.principalSubdivision,
                country: location.country,
                pincode: location.pincode
              },
              source: 'mapmyindia'
            };
            
            result.success = true;
            return result;
          }
        } catch (error) {
          console.error('MapMyIndia geocode error:', error);
        }
      }

      // Fallback to Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=in&limit=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            const location = data[0];
            
            result.coordinates = {
              lat: parseFloat(location.lat),
              lng: parseFloat(location.lon)
            };
            
            result.address = {
              formatted: location.display_name,
              components: {
                locality: location.address?.suburb,
                city: location.address?.city || location.address?.town,
                state: location.address?.state,
                country: location.address?.country,
                pincode: location.address?.postcode
              },
              source: 'nominatim'
            };
            
            result.success = true;
            return result;
          }
        }
      } catch (error) {
        console.error('Nominatim geocode error:', error);
      }

      result.error = 'Could not find coordinates for the address';
      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  // Format MapMyIndia address
  formatMapMyIndiaAddress(location) {
    const parts = [];
    if (location.locality) parts.push(location.locality);
    if (location.city && location.city !== location.locality) parts.push(location.city);
    if (location.principalSubdivision) parts.push(location.principalSubdivision);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ');
  }

  // Format BigDataCloud address
  formatBigDataCloudAddress(data) {
    const parts = [];
    if (data.locality) parts.push(data.locality);
    if (data.city && data.city !== data.locality) parts.push(data.city);
    if (data.principalSubdivision) parts.push(data.principalSubdivision);
    if (data.countryName) parts.push(data.countryName);
    
    return parts.join(', ');
  }

  // Validate location data for database storage
  validateLocationData(locationData) {
    const errors = [];

    if (!locationData.address) {
      errors.push('Address is required');
    }

    if (!locationData.coordinates || !locationData.coordinates.lat || !locationData.coordinates.lng) {
      errors.push('Valid coordinates are required');
    }

    if (locationData.coordinates) {
      const { lat, lng } = locationData.coordinates;
      if (lat < -90 || lat > 90) {
        errors.push('Invalid latitude value');
      }
      if (lng < -180 || lng > 180) {
        errors.push('Invalid longitude value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Prepare location data for database storage
  prepareLocationForDatabase(locationData) {
    const validation = this.validateLocationData(locationData);
    
    if (!validation.isValid) {
      throw new Error(`Location validation failed: ${validation.errors.join(', ')}`);
    }

    return {
      address: locationData.address,
      coordinates: {
        lat: locationData.coordinates.lat,
        lng: locationData.coordinates.lng
      }
    };
  }

  // Get location suggestions for turf creation/editing
  async getLocationSuggestions(query) {
    const results = await this.searchLocations(query);
    
    // Combine and prioritize results
    const allSuggestions = [
      ...results.mapMyIndia.map(item => ({ ...item, priority: 1 })),
      ...results.indiaPost.map(item => ({ ...item, priority: 2 }))
    ];

    // Sort by priority and relevance
    return allSuggestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Get current location using browser geolocation
  async getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: 'Geolocation is not supported by this browser.',
          location: null
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            error: null
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location. ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Please try again.';
              break;
          }
          
          resolve({
            success: false,
            error: errorMessage,
            location: null
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Get popular cities for quick selection
  getPopularCities() {
    return [
      {
        id: 'mumbai',
        name: 'Mumbai',
        state: 'Maharashtra',
        type: 'metro',
        popular: true,
        display: 'Mumbai, Maharashtra'
      },
      {
        id: 'delhi',
        name: 'Delhi',
        state: 'Delhi',
        type: 'metro',
        popular: true,
        display: 'Delhi, Delhi'
      },
      {
        id: 'bangalore',
        name: 'Bangalore',
        state: 'Karnataka',
        type: 'metro',
        popular: true,
        display: 'Bangalore, Karnataka'
      },
      {
        id: 'hyderabad',
        name: 'Hyderabad',
        state: 'Telangana',
        type: 'metro',
        popular: true,
        display: 'Hyderabad, Telangana'
      },
      {
        id: 'chennai',
        name: 'Chennai',
        state: 'Tamil Nadu',
        type: 'metro',
        popular: true,
        display: 'Chennai, Tamil Nadu'
      },
      {
        id: 'kolkata',
        name: 'Kolkata',
        state: 'West Bengal',
        type: 'metro',
        popular: true,
        display: 'Kolkata, West Bengal'
      },
      {
        id: 'pune',
        name: 'Pune',
        state: 'Maharashtra',
        type: 'city',
        popular: true,
        display: 'Pune, Maharashtra'
      },
      {
        id: 'ahmedabad',
        name: 'Ahmedabad',
        state: 'Gujarat',
        type: 'city',
        popular: true,
        display: 'Ahmedabad, Gujarat'
      }
    ];
  }

  // Prepare location data for turf database storage
  prepareTurfLocationData(locationData) {
    const validation = this.validateLocationData(locationData);
    
    if (!validation.isValid) {
      throw new Error(`Location validation failed: ${validation.errors.join(', ')}`);
    }

    // Format for your database structure
    return {
      address: locationData.address,
      coordinates: {
        lat: locationData.coordinates.lat,
        lng: locationData.coordinates.lng
      }
    };
  }

  // Search locations and return results in the format expected by LocationInput
  async searchLocationsForInput(query) {
    const results = await this.searchLocations(query);
    
    // Combine results from both sources
    const allResults = [
      ...results.mapMyIndia,
      ...results.indiaPost
    ];

    // Format for LocationInput component
    return allResults.map(location => ({
      id: location.id,
      name: location.name,
      display: location.display,
      type: location.type,
      state: location.state,
      city: location.city,
      district: location.district,
      coordinates: location.coordinates,
      address: location.address,
      source: location.source
    }));
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;
