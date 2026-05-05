import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { EnhancedErrorBoundary as ErrorBoundary } from './components/EnhancedErrorBoundary';
import EnhancedOfflineIndicator from './components/EnhancedOfflineIndicator';

import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';

interface TopMatch {
  founderType: string;
  score: number;
  description: string;
}

interface Profile {
  founderType: string;
  summary?: string;
  matches?: TopMatch[];
  [key: string]: unknown;
}

// Global ref for synchronous access to answers
const globalAnswersRef = { current: null as string | null };

const windowDimensions = Dimensions.get('window');
const initialSafeAreaMetrics = {
  frame: {
    x: 0,
    y: 0,
    width: windowDimensions.width,
    height: windowDimensions.height,
  },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentAnswers, setCurrentAnswers] = useState<Record<
    number,
    string
  > | null>(null);

  useEffect(() => {
    void initializeAppServices();
  }, []);

  const initializeAppServices = async () => {
    try {
      const [
        Sentry,
        { testSupabaseConnection },
        { FreeAnalytics },
        { analytics },
        { performanceMonitor },
        { PerformanceOptimizer },
        { EmailSystem },
        { AccessibilityManager },
        { OfflineManager },
        notifications,
      ] = await Promise.all([
        import('@sentry/react-native'),
        import('./lib/supabase'),
        import('./lib/freeAnalytics'),
        import('./lib/vercelAnalytics'),
        import('./lib/performanceMonitoring'),
        import('./lib/performanceOptimization'),
        import('./lib/emailSystem'),
        import('./lib/accessibility'),
        import('./lib/offlineMode'),
        import('./lib/notifications'),
      ]);

      testSupabaseConnection();

      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableInExpoDevelopment: false,
        debug: false,
        tracesSampleRate: 0.1,
        environment: __DEV__ ? 'development' : 'production',
        attachStacktrace: true,
        enableAutoSessionTracking: true,
      } as any);

      FreeAnalytics.initialize();

      analytics.initialize();

      performanceMonitor.initialize();

      const performanceOptimizer = PerformanceOptimizer.getInstance();
      performanceOptimizer.startPerformanceMonitoring();

      const emailSystem = EmailSystem.getInstance();
      emailSystem.configure({
        provider: 'resend',
        apiKey: '',
        fromEmail: 'noreply@foundertype.app',
        fromName: 'FounderType',
      });

      AccessibilityManager.getInstance();

      OfflineManager.getInstance();

      notifications.NotificationService.initialize();

      await checkMissedCommitmentDays(notifications.sendMissedDaysAlert);
    } catch (error) {
      console.error('Error initializing app services:', error);
    }
  };

  const checkMissedCommitmentDays = async (
    sendMissedDaysAlert: (
      daysMissed: number,
      commitmentText: string
    ) => Promise<void>
  ) => {
    try {
      const {
        getCurrentUserId,
        getCachedActiveCommitment,
        getActiveCommitment,
      } = await import('./lib/storage');
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Try cached first, then fetch from Supabase
      let commitment = await getCachedActiveCommitment();
      if (!commitment) {
        commitment = await getActiveCommitment(userId);
      }
      if (!commitment) return;

      const checkIns: string[] = commitment.check_ins || [];
      if (checkIns.length === 0) return;

      // Find the most recent check-in date
      const sorted = [...checkIns].sort();
      const lastCheckIn = new Date(sorted[sorted.length - 1]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysSinceLast = Math.floor(
        (today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLast >= 3) {
        await sendMissedDaysAlert(daysSinceLast, commitment.commitment_text);
      }
    } catch (error) {
      console.error('Error checking missed commitment days:', error);
    }
  };

  return (
    <SafeAreaProvider initialMetrics={initialSafeAreaMetrics}>
      <ErrorBoundary>
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <EnhancedOfflineIndicator />
            <UserProvider>
              <AppNavigator
                currentProfile={currentProfile}
                setCurrentProfile={setCurrentProfile}
                currentAnswers={currentAnswers}
                setCurrentAnswers={setCurrentAnswers}
                globalAnswersRef={globalAnswersRef}
              />
            </UserProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
