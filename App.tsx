import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { testSupabaseConnection } from './lib/supabase';
import { getCurrentUserId, getCachedActiveCommitment, getActiveCommitment } from './lib/storage';
import { sendMissedDaysAlert } from './lib/notifications';
import AppNavigator from './navigation/AppNavigator';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';

import { UserProvider } from './context/UserContext';

// Global ref for synchronous access to answers
const globalAnswersRef = { current: null as string | null };

export default Sentry.wrap(function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState(null);

  useEffect(() => {
    testSupabaseConnection();
    
    // Initialize Sentry
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      enableInExpoDevelopment: __DEV__,
      debug: false,
      tracesSampleRate: 0.2,
    } as any);

    
    // Check for missed commitment check-in days
    checkMissedCommitmentDays();
  }, []);

  const checkMissedCommitmentDays = async () => {
    try {
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
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
      </SafeAreaProvider>
    </ErrorBoundary>
  );
});
