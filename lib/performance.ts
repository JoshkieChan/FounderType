import Logger from './logger';

interface PerformanceMetrics {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  slowRenders: Array<{ id: string; duration: number; timestamp: number }>;
}

class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetrics> = new Map();

  static trackRender(componentName: string, duration: number) {
    const current = this.metrics.get(componentName) || {
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      slowRenders: [],
    };

    current.renderCount++;
    current.totalRenderTime += duration;
    current.averageRenderTime = current.totalRenderTime / current.renderCount;

    if (duration > 16) {
      // 60fps threshold
      current.slowRenders.push({
        id: componentName,
        duration,
        timestamp: Date.now(),
      });

      Logger.warn(`Slow render detected in ${componentName}`, {
        duration,
        averageRenderTime: current.averageRenderTime,
      });
    }

    this.metrics.set(componentName, current);
  }

  static getMetrics(componentName?: string) {
    if (componentName) {
      return this.metrics.get(componentName);
    }
    return Object.fromEntries(this.metrics);
  }

  static resetMetrics() {
    this.metrics.clear();
  }
}

export const measureRender = (componentName: string) => {
  const startTime = performance.now();
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    PerformanceMonitor.trackRender(componentName, duration);
    return duration;
  };
};

export default PerformanceMonitor;
