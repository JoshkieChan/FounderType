import { FreeAnalytics } from './freeAnalytics';

type FunnelEventName =
  | 'product_hunt_onboarding_start'
  | 'product_hunt_diagnostic_complete'
  | 'product_hunt_commitment_screen_reached'
  | 'product_hunt_captcha_complete'
  | 'product_hunt_commitment_posted'
  | 'accountability_receipt_logged'
  | 'accountability_receipt_email_sent'
  | 'accountability_receipt_email_failed';

declare global {
  interface Window {
    va?: (
      action: 'pageview' | 'track',
      eventOrProperties?: string | Record<string, unknown>,
      properties?: Record<string, unknown>
    ) => void;
  }
}

export function trackFunnelEvent(
  event: FunnelEventName,
  properties: Record<string, unknown> = {},
  userId?: string
) {
  const payload = {
    funnel: 'product_hunt_web',
    timestamp: Date.now(),
    ...properties,
  };

  FreeAnalytics.trackEvent(event, payload, userId);

  if (typeof window !== 'undefined' && typeof window.va === 'function') {
    window.va('track', event, payload);
  }
}
