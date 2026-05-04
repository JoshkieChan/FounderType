// CDN configuration for static assets optimization

export interface CDNConfig {
  baseUrl: string;
  regions: string[];
  cacheHeaders: {
    'Cache-Control': string;
    Expires: string;
    ETag: string;
  };
  compression: boolean;
  optimization: {
    images: boolean;
    fonts: boolean;
    scripts: boolean;
    styles: boolean;
  };
}

export class CDNManager {
  private static instance: CDNManager;
  private config: CDNConfig;

  private constructor() {
    this.config = {
      baseUrl: 'https://cdn.foundertype.com',
      regions: ['us-east-1', 'eu-west-1', 'asia-southeast-1'],
      cacheHeaders: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        Expires: new Date(Date.now() + 31536000000).toUTCString(),
        ETag: '',
      },
      compression: true,
      optimization: {
        images: true,
        fonts: true,
        scripts: true,
        styles: true,
      },
    };
  }

  static getInstance(): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager();
    }
    return CDNManager.instance;
  }

  // Generate CDN URL for assets
  getAssetUrl(path: string, version?: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const versionStr = version ? `?v=${version}` : '';
    return `${this.config.baseUrl}/${cleanPath}${versionStr}`;
  }

  // Generate optimized image URL
  getImageUrl(
    path: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpg' | 'png';
    }
  ): string {
    const baseUrl = this.getAssetUrl(path);
    if (!options) return baseUrl;

    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('f', options.format);

    return `${baseUrl}?${params.toString()}`;
  }

  // Generate preloading hints for critical assets
  generatePreloadHints(): string[] {
    const hints: string[] = [];

    // Critical CSS
    hints.push(
      `<link rel="preload" href="${this.getAssetUrl('css/main.css')}" as="style">`
    );

    // Critical JavaScript
    hints.push(
      `<link rel="preload" href="${this.getAssetUrl('js/main.js')}" as="script">`
    );

    // Critical fonts
    hints.push(
      `<link rel="preload" href="${this.getAssetUrl('fonts/inter.woff2')}" as="font" type="font/woff2" crossorigin>`
    );

    // Critical images
    hints.push(
      `<link rel="preload" href="${this.getImageUrl('images/logo.png', { width: 200, height: 200 })}" as="image">`
    );

    return hints;
  }

  // Generate service worker for caching
  generateServiceWorker(): string {
    return `
// Service Worker for CDN caching
const CACHE_NAME = 'foundertype-v1';
const CDN_BASE = '${this.config.baseUrl}';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '${this.getAssetUrl('css/main.css')}',
        '${this.getAssetUrl('js/main.js')}',
        '${this.getAssetUrl('fonts/inter.woff2')}',
        '${this.getImageUrl('images/logo.png', { width: 200, height: 200 })}'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(CDN_BASE)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((fetchResponse) => {
          if (fetchResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, fetchResponse.clone());
            });
          }
          return fetchResponse;
        });
      })
    );
  }
});
`;
  }

  // Generate webpack configuration for CDN
  getWebpackConfig(): any {
    return {
      output: {
        publicPath: this.config.baseUrl + '/',
        crossOriginLoading: 'anonymous',
      },
      optimization: {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\\\/]node_modules[\\\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      },
      module: {
        rules: [
          {
            test: /\\.(png|jpg|jpeg|gif|svg|webp)$/i,
            type: 'asset/resource',
            generator: {
              filename: 'images/[name].[hash][ext]',
            },
          },
          {
            test: /\\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
            generator: {
              filename: 'fonts/[name].[hash][ext]',
            },
          },
        ],
      },
    };
  }

  // Generate Next.js configuration for CDN
  getNextJsConfig(): any {
    return {
      images: {
        domains: ['cdn.foundertype.com'],
        loader: 'custom',
        loaderFile: './lib/imageLoader.js',
      },
      assetPrefix: this.config.baseUrl,
      generateEtags: true,
      compress: true,
    };
  }

  // Generate Vercel configuration for CDN
  getVercelConfig(): any {
    return {
      version: 2,
      builds: [
        {
          src: 'public/**/*',
          use: '@vercel/static',
        },
      ],
      routes: [
        {
          src: '/static/(.*)',
          headers: this.config.cacheHeaders,
        },
        {
          src: '/images/(.*)',
          headers: {
            ...this.config.cacheHeaders,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        },
        {
          src: '/fonts/(.*)',
          headers: {
            ...this.config.cacheHeaders,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        },
      ],
    };
  }
}

// Image optimization utilities
export class ImageOptimizer {
  // Generate responsive image srcset
  static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
  }

  // Generate picture element for modern formats
  static generatePictureElement(
    imageUrl: string,
    alt: string,
    widths: number[]
  ): string {
    const webpSources = widths
      .map(
        (width) =>
          `<source srcset="${imageUrl}?w=${width}&format=webp" media="(max-width: ${width}px)" type="image/webp">`
      )
      .join('\n    ');

    const avifSources = widths
      .map(
        (width) =>
          `<source srcset="${imageUrl}?w=${width}&format=avif" media="(max-width: ${width}px)" type="image/avif">`
      )
      .join('\n    ');

    const imgSources = widths
      .map((width) => `${imageUrl}?w=${width} ${width}w`)
      .join(', ');

    return `
<picture>
  ${avifSources}
  ${webpSources}
  <img src="${imageUrl}" alt="${alt}" srcset="${imgSources}" loading="lazy" decoding="async">
</picture>`;
  }
}

// Font optimization utilities
export class FontOptimizer {
  // Generate font-face rules with display swap
  static generateFontFace(
    family: string,
    src: string,
    weight: string = '400'
  ): string {
    return `
@font-face {
  font-family: '${family}';
  src: url('${src}') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
}`;
  }

  // Generate critical font CSS
  static generateCriticalFonts(): string {
    return `
/* Critical fonts */
${this.generateFontFace('Inter', '/fonts/inter-regular.woff2', '400')}
${this.generateFontFace('Inter', '/fonts/inter-medium.woff2', '500')}
${this.generateFontFace('Inter', '/fonts/inter-bold.woff2', '700')}

/* Fallback fonts */
.font-fallback {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`;
  }
}

// Export singleton instance
export const cdnManager = CDNManager.getInstance();
