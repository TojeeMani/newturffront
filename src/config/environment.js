// Environment configuration for TurfEase
const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  
  // Debug settings
  DEBUG: process.env.REACT_APP_DEBUG === 'true' || process.env.NODE_ENV === 'development',
  
  // Location service settings
  USE_FALLBACK_LOCATIONS: process.env.REACT_APP_USE_FALLBACK_LOCATIONS === 'true' || true,
  
  // SSL settings
  DISABLE_SSL_VERIFICATION: process.env.REACT_APP_DISABLE_SSL_VERIFICATION === 'true' || false,
  
  // Feature flags
  ENABLE_OCR: true,
  ENABLE_ANALYTICS: true,
  ENABLE_LOCATION_SERVICES: true,
  
  // External API settings
  INDIA_POST_API_ENABLED: false, // Disabled due to SSL issues
  MAPMYINDIA_API_ENABLED: true,
  
  // Development helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
