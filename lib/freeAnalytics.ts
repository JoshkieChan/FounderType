// Free analytics service implementation
// Uses Vercel Analytics (free) and localStorage for basic tracking

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

export interface PageView {
  path: string;
  referrer?: string;
  userAgent?: string;
  timestamp: number;
  userId?: string;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  avgSessionDuration: number;
}

export class FreeAnalytics {
  private static readonly STORAGE_KEY = 'foundertype_analytics';
  private static readonly MAX_EVENTS = 1000; // Limit to prevent storage bloat

  // Track page view
  static trackPageView(path: string, userId?: string): void {
    try {
      const pageView: PageView = {
        path,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        userAgent:
          typeof window !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: Date.now(),
        userId,
      };

      this.storeEvent('page_view', pageView);

      // Vercel Analytics auto-tracking (if available)
      if (typeof window !== 'undefined' && (window as any).vercelAnalytics) {
        (window as any).vercelAnalytics.track('pageview', { path, userId });
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Track custom event
  static trackEvent(
    event: string,
    properties?: Record<string, any>,
    userId?: string
  ): void {
    try {
      const analyticsEvent: AnalyticsEvent = {
        event,
        properties,
        timestamp: Date.now(),
        userId,
      };

      this.storeEvent('custom_event', analyticsEvent);

      // Vercel Analytics tracking (if available)
      if (typeof window !== 'undefined' && (window as any).vercelAnalytics) {
        (window as any).vercelAnalytics.track(event, { ...properties, userId });
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Track user engagement
  static trackEngagement(
    action: string,
    target: string,
    userId?: string
  ): void {
    this.trackEvent('engagement', { action, target }, userId);
  }

  // Track commitment events
  static trackCommitmentCreated(userId?: string): void {
    this.trackEvent('commitment_created', { source: 'app' }, userId);
  }

  static trackCommitmentCompleted(userId?: string, days: number = 30): void {
    this.trackEvent('commitment_completed', { days }, userId);
  }

  static trackCommitmentAbandoned(userId?: string, days: number = 0): void {
    this.trackEvent('commitment_abandoned', { days }, userId);
  }

  static trackDailyCheckIn(userId?: string, day: number): void {
    this.trackEvent('daily_checkin', { day }, userId);
  }

  // Track onboarding events
  static trackOnboardingStep(step: number, userId?: string): void {
    this.trackEvent('onboarding_step', { step }, userId);
  }

  static trackOnboardingCompleted(userId?: string): void {
    this.trackEvent('onboarding_completed', {}, userId);
  }

  // Track feature usage
  static trackFeatureUsed(feature: string, userId?: string): void {
    this.trackEvent('feature_used', { feature }, userId);
  }

  // Store event in localStorage
  private static storeEvent(type: string, data: any): void {
    try {
      const existing = this.getStoredData();
      const events = existing.events || [];

      events.push({
        type,
        data,
        timestamp: Date.now(),
      });

      // Limit events to prevent storage bloat
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }

      const updated = { ...existing, events };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error storing analytics event:', error);
    }
  }

  // Get stored analytics data
  private static getStoredData(): any {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : { events: [] };
    } catch (error) {
      console.error('Error retrieving analytics data:', error);
      return { events: [] };
    }
  }

  // Get basic metrics
  static getMetrics(): UserMetrics {
    try {
      const data = this.getStoredData();
      const events = data.events || [];

      const pageViews = events.filter((e: any) => e.type === 'page_view');
      const customEvents = events.filter((e: any) => e.type === 'custom_event');

      // Calculate basic metrics
      const uniqueUsers = new Set();
      const uniquePaths = new Set();

      pageViews.forEach((pv: any) => {
        if (pv.data.userId) uniqueUsers.add(pv.data.userId);
        if (pv.data.path) uniquePaths.add(pv.data.path);
      });

      const totalUsers = uniqueUsers.size;
      const totalPages = uniquePaths.size;

      // Calculate active users (last 7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentEvents = events.filter(
        (e: any) => e.timestamp > sevenDaysAgo
      );
      const recentUsers = new Set();

      recentEvents.forEach((event: any) => {
        if (event.data.userId) recentUsers.add(event.data.userId);
      });

      const activeUsers = recentUsers.size;

      // Calculate new users (first-time page views)
      const newUsers = pageViews.filter((pv: any) => {
        const userEvents = pageViews.filter(
          (p: any) => p.data.userId === pv.data.userId
        );
        return userEvents.length === 1;
      }).length;

      // Calculate retention rate (simplified)
      const retentionRate =
        totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Calculate average session duration (simplified)
      const sessionDurations = this.calculateSessionDurations(pageViews);
      const avgSessionDuration =
        sessionDurations.length > 0
          ? sessionDurations.reduce((a, b) => a + b, 0) /
            sessionDurations.length
          : 0;

      return {
        totalUsers,
        activeUsers,
        newUsers,
        retentionRate,
        avgSessionDuration,
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        retentionRate: 0,
        avgSessionDuration: 0,
      };
    }
  }

  // Calculate session durations (simplified)
  private static calculateSessionDurations(pageViews: any[]): number[] {
    const sessions: Record<string, { start: number; end: number }> = {};

    pageViews.forEach((pv: any) => {
      const userId = pv.data.userId || 'anonymous';
      const path = pv.data.path || '/';
      const sessionKey = `${userId}_${path}`;

      if (!sessions[sessionKey]) {
        sessions[sessionKey] = { start: pv.timestamp, end: pv.timestamp };
      } else {
        sessions[sessionKey].end = pv.timestamp;
      }
    });

    return Object.values(sessions)
      .map((session) => session.end - session.start)
      .filter((duration) => duration > 0 && duration < 3600000); // Filter out sessions over 1 hour
  }

  // Get event counts by type
  static getEventCounts(): Record<string, number> {
    try {
      const data = this.getStoredData();
      const events = data.events || [];
      const counts: Record<string, number> = {};

      events.forEach((event: any) => {
        if (event.type === 'custom_event') {
          const eventName = event.data.event;
          counts[eventName] = (counts[eventName] || 0) + 1;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting event counts:', error);
      return {};
    }
  }

  // Get top pages
  static getTopPages(
    limit: number = 10
  ): Array<{ path: string; views: number }> {
    try {
      const data = this.getStoredData();
      const pageViews =
        data.events?.filter((e: any) => e.type === 'page_view') || [];
      const pageCounts: Record<string, number> = {};

      pageViews.forEach((pv: any) => {
        const path = pv.data.path || '/';
        pageCounts[path] = (pageCounts[path] || 0) + 1;
      });

      return Object.entries(pageCounts)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top pages:', error);
      return [];
    }
  }

  // Export analytics data (for backup or analysis)
  static exportData(): string {
    try {
      const data = this.getStoredData();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      return '{}';
    }
  }

  // Clear analytics data
  static clearData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }

  // Initialize analytics tracking
  static initialize(): void {
    if (typeof window === 'undefined') return;

    // Track initial page view
    this.trackPageView(window.location.pathname);

    // Track page views on route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      FreeAnalytics.trackPageView(window.location.pathname);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      FreeAnalytics.trackPageView(window.location.pathname);
    };

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', { duration: Date.now() });
    });
  }
}

// React hook for analytics
export function useAnalytics(userId?: string) {
  const trackPageView = (path: string) => {
    FreeAnalytics.trackPageView(path, userId);
  };

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    FreeAnalytics.trackEvent(event, properties, userId);
  };

  const trackCommitmentCreated = () => {
    FreeAnalytics.trackCommitmentCreated(userId);
  };

  const trackCommitmentCompleted = (days: number = 30) => {
    FreeAnalytics.trackCommitmentCompleted(userId, days);
  };

  const trackCommitmentAbandoned = (days: number = 0) => {
    FreeAnalytics.trackCommitmentAbandoned(userId, days);
  };

  const trackDailyCheckIn = (day: number) => {
    FreeAnalytics.trackDailyCheckIn(userId, day);
  };

  const trackFeatureUsed = (feature: string) => {
    FreeAnalytics.trackFeatureUsed(feature, userId);
  };

  const getMetrics = () => {
    return FreeAnalytics.getMetrics();
  };

  const getEventCounts = () => {
    return FreeAnalytics.getEventCounts();
  };

  const getTopPages = () => {
    return FreeAnalytics.getTopPages();
  };

  return {
    trackPageView,
    trackEvent,
    trackCommitmentCreated,
    trackCommitmentCompleted,
    trackCommitmentAbandoned,
    trackDailyCheckIn,
    trackFeatureUsed,
    getMetrics,
    getEventCounts,
    getTopPages,
  };
}
