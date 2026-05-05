// Performance Optimization for FounderType
// Bundle optimization, lazy loading, and performance monitoring

export interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
}

export interface LazyLoadConfig {
  component: string;
  threshold: number;
  rootMargin: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

type FirstInputPerformanceEntry = PerformanceEntry & {
  processingStart?: number;
};

type LayoutShiftPerformanceEntry = PerformanceEntry & {
  hadRecentInput?: boolean;
  value?: number;
};

type SizedPerformanceEntry = PerformanceEntry & {
  size?: number;
  transferSize?: number;
};

type MemoryPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number;
  };
};

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private loadedComponents: Set<string> = new Set();
  private performanceMetrics: PerformanceMetric[] = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Bundle size optimization
  async getBundleSize(): Promise<number> {
    // In a real app, this would fetch from webpack stats.
    return 2000000; // 2MB current size
  }

  // Lazy loading configuration
  getLazyLoadConfig(): LazyLoadConfig[] {
    return [
      {
        component: 'PublicFeedScreen',
        threshold: 0.3,
        rootMargin: '200px',
      },
      {
        component: 'TemplateScreen',
        threshold: 0.2,
        rootMargin: '100px',
      },
      {
        component: 'DailyCheckInScreen',
        threshold: 0.25,
        rootMargin: '150px',
      },
      {
        component: 'SettingsScreen',
        threshold: 0.3,
        rootMargin: '100px',
      },
    ];
  }

  // Code splitting implementation
  async loadComponent(componentName: string): Promise<void> {
    if (this.loadedComponents.has(componentName)) {
      return;
    }

    try {
      // Dynamic import for code splitting
      const module = await import(`../screens/${componentName}.tsx`);
      this.loadedComponents.add(componentName);

      // Track loading performance
      this.trackLoadTime(componentName);
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }

  private trackLoadTime(componentName: string): void {
    const startTime = performance.now();
    const endTime = performance.now();

    const metric: PerformanceMetric = {
      name: componentName,
      value: endTime - startTime,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);

    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  // Image optimization
  optimizeImage(src: string, width?: number, height?: number): string {
    if (!width || !height) {
      return src;
    }

    // Add size parameters for image optimization
    const separator = src.includes('?') ? '&' : '?';
    return `${src}${separator}w=${width}&h=${height}&f=webp&q=80`;
  }

  // Critical CSS inlining
  getCriticalCSS(): string {
    return `
      .critical-above-fold { display: block; }
      .non-critical { display: none; }
    `;
  }

  // Resource hints
  getResourceHints(): string[] {
    return [
      '<link rel="preload" href="/static/js/main.js" as="script" />',
      '<link rel="preload" href="/static/css/main.css" as="style" />',
      '<link rel="preconnect" href="https://fonts.googleapis.com" />',
      '<link rel="preconnect" href="https://fonts.gstatic.com" />',
    ];
  }

  // Service Worker for caching
  getServiceWorker(): string {
    return `
      // Service Worker for caching
      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open('v1').then((cache) => {
            return cache.addAll([
              '/',
              '/static/js/main.js',
              '/static/css/main.css',
            ]);
          })
        );
      });

      self.addEventListener('fetch', (event) => {
        event.respondWith(
          caches.match(event.request).then((response) => {
            return response || fetch(event.request);
          })
        );
      });
    `;
  }

  // Performance monitoring
  startPerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Monitor Core Web Vitals
      this.observeWebVitals();

      // Monitor bundle size
      this.observeBundleSize();

      // Monitor memory usage
      this.observeMemoryUsage();
    }
  }

  private observeWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries.find(
        (entry) => entry.name === 'largest-contentful-paint'
      );
      if (lcp) {
        this.recordMetric('LCP', lcp.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fid = entries.find((entry) => entry.name === 'first-input') as
        | FirstInputPerformanceEntry
        | undefined;
      if (fid) {
        this.recordMetric(
          'FID',
          (fid.processingStart || fid.startTime) - fid.startTime
        );
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      list.getEntries().forEach((entry) => {
        const layoutEntry = entry as LayoutShiftPerformanceEntry;
        if (!layoutEntry.hadRecentInput) {
          clsValue += layoutEntry.value || 0;
        }
      });
      this.recordMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeBundleSize(): void {
    // Monitor bundle size changes
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const sizedEntry = entry as SizedPerformanceEntry;
          if (entry.name === 'bundle-size') {
            this.recordMetric(
              'BundleSize',
              sizedEntry.size || sizedEntry.transferSize || 0
            );
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource'] });
    }
  }

  private observeMemoryUsage(): void {
    const memoryPerformance = performance as MemoryPerformance;
    if (typeof window !== 'undefined' && memoryPerformance.memory) {
      setInterval(() => {
        if (memoryPerformance.memory) {
          this.recordMetric(
            'MemoryUsage',
            memoryPerformance.memory.usedJSHeapSize
          );
        }
      }, 10000); // Check every 10 seconds
    }
  }

  private recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);

    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  getAverageMetric(name: string): number {
    const nameMetrics = this.performanceMetrics.filter((m) => m.name === name);
    if (nameMetrics.length === 0) return 0;

    const sum = nameMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round((sum / nameMetrics.length) * 100) / 100;
  }

  // Cleanup old metrics
  cleanup(): void {
    this.performanceMetrics = this.performanceMetrics.slice(-50);
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics();
    const bundleSize = this.getAverageMetric('BundleSize');
    const lcp = this.getAverageMetric('LCP');
    const fid = this.getAverageMetric('FID');
    const cls = this.getAverageMetric('CLS');

    return `
# Performance Report

## Bundle Size
- Current: ${bundleSize} bytes
- Target: < 1MB bytes
- Status: ${bundleSize < 1000000 ? '✅ Good' : '⚠️ Needs optimization'}

## Core Web Vitals
- Largest Contentful Paint (LCP): ${lcp}ms
- First Input Delay (FID): ${fid}ms
- Cumulative Layout Shift (CLS): ${cls}

## Recommendations
${
  bundleSize > 1000000
    ? `
- Implement code splitting
- Use lazy loading for large components
- Optimize image assets
- Remove unused dependencies
`
    : ''
}
${
  lcp > 2500
    ? `
- Optimize server response time
- Implement resource hints
- Optimize critical rendering path
- Use CDN for static assets
`
    : ''
}
${
  fid > 100
    ? `
- Minimize main thread work
- Optimize JavaScript execution
- Use web workers for heavy tasks
- Reduce time to interactive
`
    : ''
}
${
  cls > 0.1
    ? `
- Optimize element shifts
- Set explicit dimensions for media
- Avoid layout thrashing
- Use CSS containment
`
    : '✅ Good CLS score'
}

## Recent Performance Metrics
${metrics
  .slice(-10)
  .map(
    (metric) =>
      `- ${metric.name}: ${metric.value.toFixed(2)}ms (${new Date(metric.timestamp).toLocaleString()})`
  )
  .join('\n')}
    `;
  }
}
