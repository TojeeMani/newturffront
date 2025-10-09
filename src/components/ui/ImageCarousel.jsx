import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import EnhancedImage from './EnhancedImage';

const ImageCarousel = ({
  images = [],
  alt = 'Image',
  className = '',
  imageClassName = 'w-full h-full object-cover',
  sport,
  autoPlay = true,
  interval = 4000,
  showArrows = true,
  showIndicators = true,
  rounded = true,
}) => {
  const validImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []).slice(0, 12), [images]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!autoPlay || validImages.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((prev) => (prev + 1) % validImages.length), interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, validImages.length]);

  const goPrev = () => setIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  const goNext = () => setIndex((prev) => (prev + 1) % validImages.length);

  if (validImages.length === 0) {
    return (
      <div className={`relative bg-gray-100 dark:bg-gray-800 ${rounded ? 'rounded-2xl' : ''} overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
      </div>
    );
  }

  return (
    <div className={`relative ${rounded ? 'rounded-2xl' : ''} overflow-hidden ${className}`}>
      <EnhancedImage
        src={validImages[index]}
        alt={alt}
        className={imageClassName}
        sport={sport}
        containerClassName="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5"
      />

      {showArrows && validImages.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 backdrop-blur-sm rounded-full p-1 hover:bg-white shadow"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 backdrop-blur-sm rounded-full p-1 hover:bg-white shadow"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      )}

      {showIndicators && validImages.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1">
          {validImages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${index === i ? 'bg-primary-600' : 'bg-white/70 dark:bg-gray-600'} border border-gray-200 dark:border-gray-700`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;