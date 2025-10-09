import React, { useState, useEffect } from 'react';
import { generatePlaceholder, getFallbackImage } from '../../utils/imageUtils';

const EnhancedImage = ({ 
  src, 
  alt, 
  className = '', 
  sport = 'default',
  fallbackSrc = null,
  showPlaceholder = true,
  lazy = true,
  containerClassName = '',
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(showPlaceholder ? generatePlaceholder(400, 300, '#f3f4f6', 'Loading...') : src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const maxRetries = 2;

  useEffect(() => {
    if (!src) {
      setCurrentSrc(fallbackSrc || getFallbackImage(sport));
      setIsLoading(false);
      return;
    }

    const loadImage = () => {
      setIsLoading(true);
      setHasError(false);

      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoading(false);
        setHasError(false);
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        
        if (retryCount < maxRetries) {
          // Retry after a delay
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
        } else {
          // Use fallback after max retries
          const fallback = fallbackSrc || getFallbackImage(sport);
          setCurrentSrc(fallback);
          setIsLoading(false);
          setHasError(true);
        }
      };

      img.src = src;
    };

    loadImage();
  }, [src, retryCount, fallbackSrc, sport]);

  const handleImageError = () => {
    if (!hasError) {
      const fallback = fallbackSrc || getFallbackImage(sport);
      setCurrentSrc(fallback);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const imageProps = {
    src: currentSrc,
    alt: alt || `${sport} image`,
    className: `${className} ${isLoading ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300`,
    onError: handleImageError,
    ...props
  };

  if (lazy) {
    imageProps.loading = 'lazy';
  }

  return (
    <div className={`relative ${containerClassName}`}>
      <img {...imageProps} alt={imageProps.alt || `${sport} image`} />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}

      {hasError && (
        <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
          Fallback Image
        </div>
      )}
    </div>
  );
};

export default EnhancedImage;
