// MapMyIndia API Configuration
// Get your API key from: https://www.mapmyindia.com/api/

const MAPMYINDIA_CONFIG = {
  // Replace with your actual MapMyIndia API key
  API_KEY: process.env.REACT_APP_MAPMYINDIA_API_KEY || 'YOUR_MAPMYINDIA_API_KEY',
  
  // API Endpoints
  ENDPOINTS: {
    // Autocomplete API for location search
    AUTOCOMPLETE: 'https://atlas.mapmyindia.com/api/places/v1/autocomplete',
    
    // Geocoding API to convert address to coordinates
    GEOCODE: 'https://atlas.mapmyindia.com/api/places/v1/geocode',
    
    // Reverse geocoding API to convert coordinates to address
    REVERSE_GEOCODE: 'https://atlas.mapmyindia.com/api/places/v1/reverse',
    
    // Place details API to get detailed information about a place
    PLACE_DETAILS: 'https://atlas.mapmyindia.com/api/places/v1/place',
    
    // Nearby search API
    NEARBY: 'https://atlas.mapmyindia.com/api/places/v1/nearby',
    
    // Text search API
    TEXT_SEARCH: 'https://atlas.mapmyindia.com/api/places/v1/search'
  },
  
  // Default parameters
  DEFAULT_PARAMS: {
    region: 'IND', // India
    lang: 'en',    // English
    maxResults: 10
  }
};

// Helper function to build API URL with parameters
export const buildMapMyIndiaURL = (endpoint, params = {}) => {
  const url = new URL(endpoint);
  
  // Add API key
  url.searchParams.append('access_token', MAPMYINDIA_CONFIG.API_KEY);
  
  // Add default parameters
  Object.entries(MAPMYINDIA_CONFIG.DEFAULT_PARAMS).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Add custom parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

// API service functions
export const MapMyIndiaAPI = {
  // Search for locations with autocomplete
  async searchLocations(query, options = {}) {
    try {
      const url = buildMapMyIndiaURL(MAPMYINDIA_CONFIG.ENDPOINTS.AUTOCOMPLETE, {
        query,
        ...options
      });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.suggestedLocations || [];
    } catch (error) {
      console.error('MapMyIndia autocomplete error:', error);
      return [];
    }
  },
  
  // Get place details by place ID
  async getPlaceDetails(placeId) {
    try {
      const url = buildMapMyIndiaURL(MAPMYINDIA_CONFIG.ENDPOINTS.PLACE_DETAILS, {
        placeId
      });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MapMyIndia place details error:', error);
      return null;
    }
  },
  
  // Reverse geocoding - convert coordinates to address
  async reverseGeocode(latitude, longitude) {
    try {
      const url = buildMapMyIndiaURL(MAPMYINDIA_CONFIG.ENDPOINTS.REVERSE_GEOCODE, {
        lat: latitude,
        lng: longitude
      });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MapMyIndia reverse geocode error:', error);
      return null;
    }
  },
  
  // Geocoding - convert address to coordinates
  async geocode(address) {
    try {
      const url = buildMapMyIndiaURL(MAPMYINDIA_CONFIG.ENDPOINTS.GEOCODE, {
        address
      });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MapMyIndia geocode error:', error);
      return null;
    }
  },
  
  // Search for places by text
  async searchPlaces(query, options = {}) {
    try {
      const url = buildMapMyIndiaURL(MAPMYINDIA_CONFIG.ENDPOINTS.TEXT_SEARCH, {
        query,
        ...options
      });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.suggestedLocations || [];
    } catch (error) {
      console.error('MapMyIndia text search error:', error);
      return [];
    }
  }
};

export default MAPMYINDIA_CONFIG; 