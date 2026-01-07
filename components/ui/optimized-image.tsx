// Image optimization utilities for better performance
'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Default blur placeholder (1x1 transparent pixel)
const DEFAULT_BLUR_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Generate blur data URL from image dimensions and color
export function generateBlurDataURL(width: number, height: number, color: string = '#f3f4f6'): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    return canvas.toDataURL();
  }
  
  return DEFAULT_BLUR_DATA_URL;
}

// Optimized Image component with automatic blur placeholder
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  className,
  sizes,
  quality = 90,
  loading = 'lazy',
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Use provided blur or generate default
  const finalBlurDataURL = blurDataURL || DEFAULT_BLUR_DATA_URL;

  // Fallback for broken images
  if (imageError) {
    return (
      <div 
        className={`bg-stone-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-stone-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder={placeholder}
      blurDataURL={finalBlurDataURL}
      className={className}
      sizes={sizes}
      quality={quality}
      loading={loading}
      style={{
        objectFit,
        objectPosition,
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

// Hook for lazy loading images with intersection observer
export function useLazyImage(threshold: number = 0.1) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isIntersecting };
}

// Component for progressive image loading
interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string;
  threshold?: number;
}

export function ProgressiveImage({
  src,
  lowQualitySrc,
  threshold = 0.1,
  ...props
}: ProgressiveImageProps) {
  const { ref, isIntersecting } = useLazyImage(threshold);
  const [highQualityLoaded, setHighQualityLoaded] = useState(false);

  const imageSrc = isIntersecting ? src : (lowQualitySrc || src);

  return (
    <div ref={ref} className="relative">
      <OptimizedImage
        {...props}
        src={imageSrc}
        loading={isIntersecting ? 'eager' : 'lazy'}
        onLoad={() => {
          if (isIntersecting) {
            setHighQualityLoaded(true);
          }
          props.onLoad?.();
        }}
      />
      {isIntersecting && !highQualityLoaded && lowQualitySrc && (
        <div className="absolute inset-0 bg-stone-100 animate-pulse rounded" />
      )}
    </div>
  );
}

// Avatar component with automatic fallback
interface AvatarProps {
  src?: string | null;
  alt: string;
  size: number;
  fallbackText?: string;
  className?: string;
  priority?: boolean;
}

export function Avatar({ 
  src, 
  alt, 
  size, 
  fallbackText, 
  className = '',
  priority = false 
}: AvatarProps) {
  const [imageError, setImageError] = useState(!src);
  
  const initials = fallbackText 
    ? fallbackText.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (imageError || !src) {
    return (
      <div 
        className={`bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-medium ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
    />
  );
}

// Service image with consistent aspect ratio
interface ServiceImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ServiceImage({ 
  src, 
  alt, 
  width = 400, 
  height = 300,
  className = '' 
}: ServiceImageProps) {
  if (!src) {
    return (
      <div 
        className={`bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-amber-600 text-center">
          <div className="text-2xl mb-2">✂️</div>
          <div className="text-sm font-medium">Service Image</div>
        </div>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Gallery component for multiple images with lazy loading
interface GalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
  imageClassName?: string;
}

export function Gallery({ images, className = '', imageClassName = '' }: GalleryProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="aspect-square relative overflow-hidden rounded-lg">
          <ProgressiveImage
            src={image.src}
            alt={image.alt}
            width={image.width || 300}
            height={image.height || 300}
            className={`w-full h-full object-cover transition-transform hover:scale-105 ${imageClassName}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            loading="lazy"
            priority={index < 4} // Prioritize first 4 images
          />
        </div>
      ))}
    </div>
  );
}