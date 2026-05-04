// Vercel Web Analytics Integration Script
// This script handles Vercel Analytics events and performance tracking

// Initialize Vercel Analytics
if (typeof window !== 'undefined' && window.va) {
  // Track page views
  window.va('pageview');
  
  // Track custom events for FounderType
  const trackFounderTypeEvent = (eventName, properties = {}) => {
    window.va('track', eventName, properties);
  };
  
  // Track key user actions
  const trackUserActions = () => {
    // Commitment creation
    document.addEventListener('commitment-created', (e) => {
      trackFounderTypeEvent('commitment_created', {
        category: e.detail.category,
        duration: e.detail.duration
      });
    });
    
    // Daily check-in
    document.addEventListener('daily-checkin', (e) => {
      trackFounderTypeEvent('daily_checkin', {
        streak: e.detail.streak,
        completed: e.detail.completed
      });
    });
    
    // Profile completion
    document.addEventListener('profile-completed', () => {
      trackFounderTypeEvent('profile_completed');
    });
    
    // Social interactions
    document.addEventListener('support-given', (e) => {
      trackFounderTypeEvent('support_given', {
        type: e.detail.type
      });
    });
  };
  
  // Performance monitoring
  const trackPerformance = () => {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            trackFounderTypeEvent('performance_lcp', {
              value: Math.round(entry.startTime)
            });
          } else if (entry.entryType === 'first-input') {
            trackFounderTypeEvent('performance_fid', {
              value: Math.round(entry.processingStart - entry.startTime)
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    }
  };
  
  // Initialize tracking
  trackUserActions();
  trackPerformance();
  
  // Export for use in components
  window.FounderTypeAnalytics = {
    track: trackFounderTypeEvent
  };
}