import React from 'react';
import { Image, ImageProps } from 'react-native';
import { ImageOptimizer, OptimizedImageProps } from '../lib/imageOptimization';
import './OptimizedImage.css';

export function OptimizedImageComponent({
  src,
  alt: _alt,
  width,
  height,
  className: _className,
  loading: _loading = 'lazy',
  decoding: _decoding = 'async',
  style,
  ...props
}: OptimizedImageProps & Omit<ImageProps, 'source'>) {
  // For React Native, we'll use the original Image component with optimizations
  const optimizedSource = {
    uri: ImageOptimizer.createOptimizedUrl(src, { width, height }),
  };

  return (
    <Image
      source={optimizedSource}
      style={[style, { width, height }]}
      resizeMode="contain"
      {...props}
    />
  );
}

// Web-optimized image component for browser environments
export function WebOptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  decoding = 'async',
}: OptimizedImageProps) {
  if (typeof window === 'undefined') {
    // Server-side fallback
    const fallbackClassName =
      `optimized-image-fallback ${className || ''}`.trim();

    return (
      <img
        src={src}
        alt={alt}
        className={fallbackClassName}
        loading={loading}
        decoding={decoding}
      />
    );
  }

  // Generate picture element with modern formats
  const pictureHTML = ImageOptimizer.generatePictureElement(
    src,
    alt,
    [width || 400, 800, 1200],
    className
  );

  return <div dangerouslySetInnerHTML={{ __html: pictureHTML }} />;
}

export default OptimizedImageComponent;
