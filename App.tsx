import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { testSupabaseConnection } from './lib/supabase';
import { getCurrentUserId, getLastAssessmentDate, getCachedActiveCommitment, getActiveCommitment } from './lib/storage';
import { scheduleNotificationAsync } from 'expo-notifications';
import { sendMissedDaysAlert } from './lib/notifications';
import AppNavigator from './navigation/AppNavigator';
import { supabase } from './lib/supabase';

async function testGeminiConnection() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length);
  console.log('API Key prefix:', apiKey?.substring(0, 8));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();
    console.log('Gemini connection test:',
      response.status, JSON.stringify(data).substring(0, 200));
  } catch(e) {
    console.log('Gemini connection failed:', e);
  }
}

// Global ref for synchronous access to answers
const globalAnswersRef = { current: null as string | null };

export default Sentry.wrap(function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState(null);

  useEffect(() => {
    testGeminiConnection();
    testSupabaseConnection();
    
    // Initialize Sentry
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      enableInExpoDevelopment: __DEV__,
      debug: false,
      tracesSampleRate: 0.2,
    } as any);

    // Initialize anonymous auth
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous auth failed:', error);
        } else {
          console.log('Anonymous auth successful:', data.user?.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      }
    };
    initAuth();

    // Initialize RevenueCat only once using a flag
    const revenueCatKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    if (revenueCatKey && !(global as any).revenueCatInitialized) {
      Purchases.configure({ apiKey: revenueCatKey });
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      (global as any).revenueCatInitialized = true;
      console.log('RevenueCat initialized');
    } else if (!revenueCatKey) {
      console.warn('RevenueCat API key not found');
    }

    // Check for 30-day reassessment
    checkReassessment();

    // Check for missed commitment check-in days
    checkMissedCommitmentDays();
  }, []);

  const checkReassessment = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const lastAssessmentDate = await getLastAssessmentDate(userId);
      if (!lastAssessmentDate) return;

      const lastDate = new Date(lastAssessmentDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 30) {
        console.log('30+ days since last assessment, showing reassessment');
        
        // Schedule notification for reassessment
        await scheduleNotificationAsync({
          content: {
            title: "Time for your 30-day check-in",
            body: "See how your FounderType has evolved in the last month.",
            sound: true,
          },
          trigger: null, // Show immediately
        });

        // Note: The navigation to ReassessmentScreen would be handled by AppNavigator
        // based on app state or user interaction
      }
    } catch (error) {
      console.error('Error checking reassessment:', error);
      Sentry.captureException(error);
    }
  };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator 
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        currentAnswers={currentAnswers}
        setCurrentAnswers={setCurrentAnswers}
        globalAnswersRef={globalAnswersRef}
      />
    </GestureHandlerRootView>
  );
});
