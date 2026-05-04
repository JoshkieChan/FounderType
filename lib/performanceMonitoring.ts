// Performance Monitoring for FounderType
// Tracks Core Web Vitals and app performance metrics

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface WebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private isWeb = typeof window !== 'undefined' && 'performance' in window;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  initialize(): void {
    if (!this.isWeb) return;

    this.trackPageLoadMetrics();
    this.observeWebVitals();
    this.trackUserInteractions();
  }

  private trackPageLoadMetrics(): void {
    if (!this.isWeb) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          this.recordMetric(
            'dom_content_loaded',
            navigation.domContentLoadedEventEnd -
              navigation.domContentLoadedEventStart
          );
          this.recordMetric(
            'page_load_time',
            navigation.loadEventEnd - navigation.loadEventStart
          );
          this.recordMetric(
            'time_to_first_byte',
            navigation.responseStart - navigation.requestStart
          );
          this.recordMetric(
            'dom_interactive',
            navigation.domInteractive - navigation.navigationStart
          );
        }
      }, 0);
    });
  }

  private observeWebVitals(): void {
    if (!this.isWeb || !('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint
      this.observeMetric('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });

      // First Input Delay
      this.observeMetric('first-input', (entries) => {
        const entry = entries[0];
        this.recordMetric('fid', entry.processingStart - entry.startTime);
      });

      // Cumulative Layout Shift
      this.observeMetric('layout-shift', (entries) => {
        let clsValue = 0;
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.recordMetric('cls', clsValue);
      });

      // First Contentful Paint
      this.observeMetric('paint', (entries) => {
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime);
          }
        });
      });
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }
  }

  private observeMetric(
    type: string,
    callback: (entries: any[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      // Some metrics may not be supported in all browsers
      console.warn(`Metric ${type} not supported:`, error);
    }
  }

  private trackUserInteractions(): void {
    if (!this.isWeb) return;

    // Track click response time
    let clickStartTime: number;
    document.addEventListener('mousedown', () => {
      clickStartTime = performance.now();
    });

    document.addEventListener('click', () => {
      if (clickStartTime) {
        const responseTime = performance.now() - clickStartTime;
        this.recordMetric('click_response_time', responseTime);
      }
    });

    // Track scroll performance
    let scrollStartTime: number;
    let scrollTimeout: NodeJS.Timeout;

    document.addEventListener('scroll', () => {
      if (!scrollStartTime) {
        scrollStartTime = performance.now();
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (scrollStartTime) {
          const scrollDuration = performance.now() - scrollStartTime;
          this.recordMetric('scroll_duration', scrollDuration);
          scrollStartTime = 0;
        }
      }, 150);
    });
  }

  private recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory issues
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).FounderTypeAnalytics) {
      (window as any).FounderTypeAnalytics.track('performance_metric', {
        metric_name: name,
        metric_value: value,
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getWebVitals(): WebVitals {
    const vitals: WebVitals = {};

    this.metrics.forEach((metric) => {
      switch (metric.name) {
        case 'lcp':
          vitals.lcp = metric.value;
          break;
        case 'fid':
          vitals.fid = metric.value;
          break;
        case 'cls':
          vitals.cls = metric.value;
          break;
        case 'fcp':
          vitals.fcp = metric.value;
          break;
        case 'time_to_first_byte':
          vitals.ttfb = metric.value;
          break;
      }
    });

    return vitals;
  }

  getAverageMetric(name: string): number {
    const nameMetrics = this.metrics.filter((m) => m.name === name);
    if (nameMetrics.length === 0) return 0;

    const sum = nameMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round((sum / nameMetrics.length) * 100) / 100;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export types
export type { PerformanceMetric, WebVitals };
