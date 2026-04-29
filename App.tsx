import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { testSupabaseConnection } from './lib/supabase';
import { supabase } from './lib/supabase';
import { getCurrentUserId, getLastAssessmentDate } from './lib/storage';
import { scheduleNotificationAsync } from 'expo-notifications';
import AppNavigator from './navigation/AppNavigator';

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
  const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous auth failed:', error);
          Sentry.captureException(error);
          return;
        }
        console.log('Anonymous auth successful, user ID:', data.user?.id);
        return data.user?.id;
      } catch (error) {
        console.error('Auth initialization error:', error);
        Sentry.captureException(error);
        return null;
      }
    };

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
