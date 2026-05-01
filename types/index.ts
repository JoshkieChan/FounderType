export interface Question {
  id: number;
  text: string;
  options: string[];
}

export interface FounderProfile {
  founderType: string;
  summary: string;
  matches: Match[];
}

export interface Match {
  model: string;
  overallScore: number;
  dimensions: {
    skillMatch: number;
    lifestyleFit: number;
    toleranceFit: number;
    timeToRevenue: number;
    growthCeiling: number;
  };
  challenge: string;
}

export interface UserAnswers {
  [questionId: number]: string;
}

// API Types
export interface GeminiAPIResponse {
  error?: string;
  message?: string;
  founderType?: string;
  summary?: string;
  matches?: Match[];
}

export interface SupabaseProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  founder_type: string;
  summary: string;
  matches: Match[];
  answers: UserAnswers;
}

// Navigation Types (re-exported for convenience)
export type { RootStackParamList } from '../navigation/AppNavigator';

// Component Props Types
export interface BaseScreenProps {
  navigation: any;
  route?: any;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  retryAction?: () => void;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface UserAnalytics {
  sessionId: string;
  userId?: string;
  events: AnalyticsEvent[];
  startTime: number;
}

// UI State Types
export interface UIState {
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;
}

// Error Types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorContext {
  error: AppError;
  component?: string;
  action?: string;
  timestamp: number;
}
