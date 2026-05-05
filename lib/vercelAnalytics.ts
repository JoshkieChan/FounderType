// Vercel Web Analytics Integration
// Comprehensive analytics tracking for FounderType

interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

interface PageViewEvent {
  path: string;
  referrer?: string;
  title?: string;
}

declare global {
  interface Window {
    va?: (
      action: 'pageview' | 'track',
      eventOrProperties?: string | Record<string, unknown>,
      properties?: Record<string, unknown>
    ) => void;
  }
}

class VercelAnalytics {
  private static instance: VercelAnalytics;
  private isInitialized = false;
  private isWeb =
    typeof window !== 'undefined' && typeof window.va === 'function';

  static getInstance(): VercelAnalytics {
    if (!VercelAnalytics.instance) {
      VercelAnalytics.instance = new VercelAnalytics();
    }
    return VercelAnalytics.instance;
  }

  initialize(): void {
    if (this.isInitialized || !this.isWeb) return;

    try {
      // Track initial page view
      this.trackPageView(window.location.pathname);
      this.isInitialized = true;
      console.log('Vercel Analytics initialized');
    } catch (error) {
      console.warn('Failed to initialize Vercel Analytics:', error);
    }
  }

  trackPageView(path: string, options?: Partial<PageViewEvent>): void {
    const va = typeof window !== 'undefined' ? window.va : undefined;
    if (!this.isWeb || !va) return;

    try {
      va('pageview', {
        path,
        referrer: options?.referrer || document.referrer,
        title: options?.title || document.title,
      });
    } catch (error) {
      console.warn('Failed to track page view:', error);
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    const va = typeof window !== 'undefined' ? window.va : undefined;
    if (!this.isWeb || !va) return;

    try {
      va('track', event.action, {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.properties,
      });
    } catch (error) {
      console.warn('Failed to track event:', error);
    }
  }

  // FounderType specific events
  trackCommitmentCreated(category: string, duration: number): void {
    this.trackEvent({
      action: 'commitment_created',
      category: 'engagement',
      label: category,
      value: duration,
      properties: {
        category,
        duration_days: duration,
        timestamp: Date.now(),
      },
    });
  }

  trackDailyCheckIn(streak: number, completed: boolean): void {
    this.trackEvent({
      action: 'daily_checkin',
      category: 'engagement',
      label: completed ? 'completed' : 'missed',
      value: streak,
      properties: {
        streak_days: streak,
        completed,
        timestamp: Date.now(),
      },
    });
  }

  trackProfileCompleted(): void {
    this.trackEvent({
      action: 'profile_completed',
      category: 'onboarding',
      properties: {
        timestamp: Date.now(),
      },
    });
  }

  trackSupportGiven(
    type: 'comment' | 'follow' | 'encourage',
    targetUserId?: string
  ): void {
    this.trackEvent({
      action: 'support_given',
      category: 'social',
      label: type,
      properties: {
        support_type: type,
        target_user_id: targetUserId,
        timestamp: Date.now(),
      },
    });
  }

  trackCommitmentCompleted(duration: number, category: string): void {
    this.trackEvent({
      action: 'commitment_completed',
      category: 'achievement',
      label: category,
      value: duration,
      properties: {
        duration_days: duration,
        category,
        timestamp: Date.now(),
      },
    });
  }

  trackAppOpened(source?: 'direct' | 'notification' | 'link'): void {
    this.trackEvent({
      action: 'app_opened',
      category: 'lifecycle',
      label: source || 'direct',
      properties: {
        source,
        timestamp: Date.now(),
      },
    });
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent({
      action: 'error_occurred',
      category: 'error',
      label: error.name,
      properties: {
        error_message: error.message,
        context,
        stack: error.stack,
        timestamp: Date.now(),
      },
    });
  }

  // Performance tracking
  trackPerformanceMetric(metric: string, value: number): void {
    this.trackEvent({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value,
      properties: {
        metric_name: metric,
        metric_value: value,
        timestamp: Date.now(),
      },
    });
  }
}

// Export singleton instance
export const analytics = VercelAnalytics.getInstance();

// Export types for use in components
export type { AnalyticsEvent, PageViewEvent };
