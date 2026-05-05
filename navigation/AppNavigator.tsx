import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const LandingScreen = lazy(() => import('../screens/LandingScreen'));
const OnboardingScreen = lazy(() => import('../screens/OnboardingScreen'));
const QuestionsScreen = lazy(() => import('../screens/QuestionsScreen'));
const ProcessingScreen = lazy(() => import('../screens/ProcessingScreen'));
const ResultsScreen = lazy(() => import('../screens/ResultsScreen'));
const CommitmentScreen = lazy(() => import('../screens/CommitmentScreen'));
const PrivacyPolicyScreen = lazy(
  () => import('../screens/PrivacyPolicyScreen')
);
const DailyCheckInScreen = lazy(() => import('../screens/DailyCheckInScreen'));
const PublicFeedScreen = lazy(() => import('../screens/PublicFeedScreen'));
const LockoutScreen = lazy(() => import('../screens/LockoutScreen'));
const TermsScreen = lazy(() => import('../screens/TermsScreen'));

interface TopMatch {
  founderType: string;
  score: number;
  description: string;
}

interface Commitment {
  id: string;
  commitment_text: string;
  daily_action?: string;
  deadline: string;
  status: string;
  created_at: string;
  check_ins: string[];
}

interface Profile {
  founderType: string;
  summary?: string;
  matches?: TopMatch[];
  [key: string]: unknown;
}

interface AppNavigatorProps {
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile | null) => void;
  currentAnswers: Record<number, string> | null;
  setCurrentAnswers: (answers: Record<number, string> | null) => void;
  globalAnswersRef: { current: string | null };
}

export type RootStackParamList = {
  landing: undefined;
  onboarding: undefined;
  questions: undefined;
  processing: { answers: string };
  results: { profile?: string; answers?: string };
  commitment: {
    profile?: string;
    answers?: string;
    editMode?: boolean;
    commitmentId?: string;
    initialText?: string;
    initialDailyAction?: string;
    initialDeadline?: string;
  };
  privacyPolicy: undefined;
  dailyCheckIn: { commitment?: Commitment } | undefined;
  publicFeed: undefined;
  lockout: undefined;
  terms: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const ScreenFallback = () => (
  <View style={styles.fallback}>
    <ActivityIndicator size="large" color="#3B82F6" />
  </View>
);

const withSuspense = (Screen: React.ComponentType<any>) => {
  function SuspendedScreen(props: any) {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <Screen {...props} />
      </Suspense>
    );
  }

  return SuspendedScreen;
};

const LandingRoute = withSuspense(LandingScreen);
const OnboardingRoute = withSuspense(OnboardingScreen);
const CommitmentRoute = withSuspense(CommitmentScreen);
const PrivacyPolicyRoute = withSuspense(PrivacyPolicyScreen);
const DailyCheckInRoute = withSuspense(DailyCheckInScreen);
const PublicFeedRoute = withSuspense(PublicFeedScreen);
const LockoutRoute = withSuspense(LockoutScreen);
const TermsRoute = withSuspense(TermsScreen);

const linking = {
  prefixes: ['https://foundertype.app', 'foundertype://'],
  config: {
    screens: {
      landing: '',
      onboarding: 'onboarding',
      questions: 'questions',
      processing: 'processing',
      results: 'results',
      commitment: 'commitment',
      privacyPolicy: 'privacy',
      dailyCheckIn: 'check-in',
      publicFeed: 'feed',
      lockout: 'lockout',
      terms: 'terms',
    },
  },
};

export default function AppNavigator({
  currentProfile,
  setCurrentProfile,
  currentAnswers,
  setCurrentAnswers,
  globalAnswersRef: _globalAnswersRef,
}: AppNavigatorProps) {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="onboarding"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
        }}
      >
        <Stack.Screen name="landing" component={LandingRoute} />
        <Stack.Screen name="onboarding" component={OnboardingRoute} />
        <Stack.Screen name="questions">
          {(props) => (
            <Suspense fallback={<ScreenFallback />}>
              <QuestionsScreen
                {...props}
                setCurrentAnswers={setCurrentAnswers}
              />
            </Suspense>
          )}
        </Stack.Screen>
        <Stack.Screen name="processing">
          {(props) => (
            <Suspense fallback={<ScreenFallback />}>
              <ProcessingScreen
                {...props}
                setCurrentProfile={setCurrentProfile}
                setCurrentAnswers={setCurrentAnswers}
              />
            </Suspense>
          )}
        </Stack.Screen>
        <Stack.Screen name="results">
          {(props) => (
            <Suspense fallback={<ScreenFallback />}>
              <ResultsScreen
                {...props}
                currentProfile={currentProfile}
                currentAnswers={currentAnswers}
              />
            </Suspense>
          )}
        </Stack.Screen>
        <Stack.Screen name="commitment" component={CommitmentRoute} />
        <Stack.Screen name="privacyPolicy" component={PrivacyPolicyRoute} />
        <Stack.Screen name="dailyCheckIn" component={DailyCheckInRoute} />
        <Stack.Screen name="publicFeed" component={PublicFeedRoute} />
        <Stack.Screen name="lockout" component={LockoutRoute} />
        <Stack.Screen name="terms" component={TermsRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
});
