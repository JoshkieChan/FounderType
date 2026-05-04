// Free image optimization utilities
// Uses browser APIs and free services to optimize images

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 0-100
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

export class ImageOptimizer {
  // Convert image to WebP format (browser native)
  static async convertToWebP(
    file: File,
    quality: number = 80
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert to WebP'));
            }
          },
          'image/webp',
          quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Resize image while maintaining aspect ratio
  static async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 80
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          'image/jpeg',
          quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate new dimensions maintaining aspect ratio
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Calculate ratio
    const ratio = Math.min(maxWidth / width, maxHeight / height);

    if (ratio < 1) {
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    return { width, height };
  }

  // Generate responsive image srcset
  static generateSrcSet(
    baseUrl: string,
    originalWidth: number,
    breakpoints: number[] = [320, 640, 960, 1280, 1920]
  ): string {
    return breakpoints
      .filter(width => width <= originalWidth)
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  }

  // Generate picture element with modern formats
  static generatePictureElement(
    imageUrl: string,
    alt: string,
    widths: number[],
    className?: string
  ): string {
    const avifSources = widths
      .map(width => `<source srcset="${imageUrl}?w=${width}&format=avif} ${width}w" type="image/avif">`)
      .join('\n    ');

    const webpSources = widths
      .map(width => `<source srcset="${imageUrl}?w=${width}&format=webp" ${width}w" type="image/webp">`)
      .join('\n    ');

    const imgSources = widths
      .map(width => `${imageUrl}?w=${width} ${width}w`)
      .join(', ');

    return `
<picture class="${className || ''}">
  ${avifSources}
  ${webpSources}
  <img src="${imageUrl}" alt="${alt}" srcset="${imgSources}" loading="lazy" decoding="async">
</picture>`;
  }

  // Get image dimensions from file
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Compress image using browser canvas
  static async compressImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<Blob> {
    const {
      width,
      height,
      quality = 80,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;

        // Apply dimensions if specified
        if (width || height) {
          const dimensions = this.calculateDimensions(
            img.width,
            img.height,
            width || img.width,
            height || img.height
          );
          targetWidth = dimensions.width;
          targetHeight = dimensions.height;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);

        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Create optimized image URL for display
  static createOptimizedUrl(
    baseUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    const params = new URLSearchParams();
    
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('f', options.format);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
}

// React component for optimized images
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'sync' | 'async' | 'auto';
}

export function OptimizedImage({
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
    return `<img src="${src}" alt="${alt}" class="${className || ''}" loading="${loading}">`;
  }

  const optimizedUrl = ImageOptimizer.createOptimizedUrl(src, { width, height });
  
  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      style={{ width, height }}
    />
  );
}