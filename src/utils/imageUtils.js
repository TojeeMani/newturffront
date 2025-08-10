// Image utilities for handling external image loading and fallbacks

// Local fallback images (SVG placeholders that always work)
export const FALLBACK_IMAGES = {
  football: '/images/fallback-football.svg',
  cricket: '/images/fallback-football.svg', // Using football as placeholder
  basketball: '/images/fallback-football.svg', // Using football as placeholder
  tennis: '/images/fallback-football.svg', // Using football as placeholder
  badminton: '/images/fallback-football.svg', // Using football as placeholder
  volleyball: '/images/fallback-football.svg', // Using football as placeholder
  hero: '/images/fallback-hero.svg',
  default: '/images/fallback-default.svg'
};

// Generate a simple colored placeholder as data URL
export const generatePlaceholder = (width = 400, height = 300, color = '#e5e7eb', text = 'Image') => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  // Add text
  ctx.fillStyle = '#6b7280';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL();
};

// Get fallback image based on sport type
export const getFallbackImage = (sport) => {
  const sportLower = sport?.toLowerCase() || 'default';
  return FALLBACK_IMAGES[sportLower] || FALLBACK_IMAGES.default;
};

// Enhanced image URL with fallback handling
export const getImageWithFallback = (originalUrl, sport = 'default') => {
  return {
    primary: originalUrl,
    fallback: getFallbackImage(sport),
    placeholder: generatePlaceholder(400, 300, '#f3f4f6', `${sport} Image`)
  };
};

// Check if image URL is accessible
export const checkImageUrl = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image URL check failed:', url, error);
    return false;
  }
};

// Preload image with promise
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Image loading with retry logic
export const loadImageWithRetry = async (src, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await preloadImage(src);
      return src;
    } catch (error) {
      console.warn(`Image load attempt ${i + 1} failed for:`, src);
      if (i === maxRetries - 1) throw error;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Convert Unsplash URL to different sizes
export const getUnsplashSizes = (url) => {
  if (!url.includes('unsplash.com')) return { original: url };
  
  const baseUrl = url.split('&w=')[0];
  return {
    thumbnail: `${baseUrl}&w=300&q=60`,
    small: `${baseUrl}&w=600&q=70`,
    medium: `${baseUrl}&w=1200&q=80`,
    large: `${baseUrl}&w=2000&q=90`,
    original: url
  };
};

// Local image URLs (for when we want to use local images instead)
export const LOCAL_IMAGES = {
  hero: '/images/hero-stadium.jpg',
  turfs: {
    football: '/images/football-turf.jpg',
    cricket: '/images/cricket-ground.jpg',
    basketball: '/images/basketball-court.jpg',
    tennis: '/images/tennis-court.jpg',
    badminton: '/images/badminton-court.jpg',
    volleyball: '/images/volleyball-court.jpg'
  },
  placeholders: {
    user: '/images/user-placeholder.svg',
    turf: '/images/turf-placeholder.svg'
  }
};
