import React, { useState } from 'react';
import { UserAnalytics, AnalyticsEvent } from '../types';

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    sessionId: generateSessionId(),
    events: [],
    startTime: Date.now(),
  });

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    setAnalytics((prev: UserAnalytics) => ({
      ...prev,
      events: [...prev.events, analyticsEvent],
    }));

    // Log to console (in production, send to analytics service)
    console.log('Analytics Event:', analyticsEvent);
  };

  const trackScreenView = (screenName: string) => {
    trackEvent('screen_view', { screen_name: screenName });
  };

  const trackUserAction = (
    action: string,
    properties?: Record<string, any>
  ) => {
    trackEvent('user_action', { action, ...properties });
  };

  const trackError = (error: string, context?: string) => {
    trackEvent('error', { error, context });
  };

  const trackPurchase = (
    productId: string,
    price: number,
    currency: string
  ) => {
    trackEvent('purchase', {
      product_id: productId,
      price,
      currency,
      value: price,
    });
  };

  const trackProfileGeneration = (founderType: string, success: boolean) => {
    trackEvent('profile_generated', {
      founder_type: founderType,
      success,
    });
  };

  const trackQuestionAnswered = (
    questionId: number,
    answer: string,
    questionNumber: number
  ) => {
    trackEvent('question_answered', {
      question_id: questionId,
      answer,
      question_number: questionNumber,
    });
  };

  const trackSessionComplete = (
    duration: number,
    questionsAnswered: number
  ) => {
    trackEvent('session_complete', {
      duration_ms: duration,
      questions_answered: questionsAnswered,
    });
  };

  const getSessionDuration = () => {
    return Date.now() - analytics.startTime;
  };

  const getEventCount = () => {
    return analytics.events.length;
  };

  const getSessionData = () => {
    return {
      ...analytics,
      duration: getSessionDuration(),
      eventCount: getEventCount(),
    };
  };

  return {
    trackEvent,
    trackScreenView,
    trackUserAction,
    trackError,
    trackPurchase,
    trackProfileGeneration,
    trackQuestionAnswered,
    trackSessionComplete,
    getSessionData,
  };
}
