import React, { useState, useRef } from 'react';
import { View } from 'react-native';
import LandingScreen from '../screens/LandingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import QuestionsScreen from '../screens/QuestionsScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import CommitmentScreen from '../screens/CommitmentScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DailyCheckInScreen from '../screens/DailyCheckInScreen';
import PublicFeedScreen from '../screens/PublicFeedScreen';
import LockoutScreen from '../screens/LockoutScreen';
import TermsScreen from '../screens/TermsScreen';
import EmailTestScreen from '../screens/EmailTestScreen';

type Screen =
  | 'landing'
  | 'onboarding'
  | 'questions'
  | 'processing'
  | 'results'
  | 'commitment'
  | 'privacyPolicy'
  | 'dailyCheckIn'
  | 'publicFeed'
  | 'lockout'
  | 'terms'
  | 'emailTest';

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

interface NavigationParams {
  answers?: string;
  profile?: string;
  answersString?: string;
  founderType?: string;
  topMatch?: TopMatch;
  commitment?: Commitment;
  commitmentText?: string;
  isPublicCommitment?: boolean;
  editMode?: boolean;
  commitmentId?: string;
  initialText?: string;
  initialDailyAction?: string;
  initialDeadline?: string;
}

interface AppNavigatorProps {
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile | null) => void;
  currentAnswers: Record<number, string> | null;
  setCurrentAnswers: (answers: Record<number, string> | null) => void;
  globalAnswersRef: { current: string | null };
}

// Re-export for screens that import RootStackParamList from here
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
  emailTest: undefined;
};

export default function AppNavigator({
  currentProfile,
  setCurrentProfile,
  currentAnswers,
  setCurrentAnswers,
  globalAnswersRef,
}: AppNavigatorProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [params, setParams] = useState<NavigationParams>({});
  const [directParams, setDirectParams] = useState<NavigationParams | null>(
    null
  );
  const [history, setHistory] = useState<
    { screen: Screen; params: NavigationParams }[]
  >([]);

  const navigate = (screen: Screen, newParams?: NavigationParams) => {
    console.log(
      'AppNavigator navigate - screen:',
      screen,
      'newParams:',
      newParams
    );
    setHistory((prev) => [...prev, { screen: currentScreen, params }]);
    setDirectParams(newParams || null);
    setParams(newParams || {});
    setCurrentScreen(screen);
  };

  const goBack = () => {
    console.log('AppNavigator goBack called');
    setHistory((prev) => {
      const newHistory = [...prev];
      const last = newHistory.pop();
      if (last) {
        console.log(
          'AppNavigator goBack - returning to:',
          last.screen,
          'with params:',
          last.params
        );
        setCurrentScreen(last.screen);
        setParams(last.params);
        setDirectParams(last.params);
      } else {
        console.log(
          'AppNavigator goBack - history empty, returning to landing'
        );
        setCurrentScreen('landing');
      }
      return newHistory;
    });
  };

  const navigation = { navigate, goBack };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen navigation={navigation as any} />;
      case 'onboarding':
        return <OnboardingScreen navigation={navigation as any} />;
      case 'questions':
        return (
          <QuestionsScreen
            navigation={navigation as any}
            setCurrentAnswers={setCurrentAnswers}
          />
        );
      case 'processing':
        return (
          <ProcessingScreen
            navigation={navigation as any}
            route={
              {
                params: { answers: directParams?.answers || params.answers },
              } as any
            }
            setCurrentProfile={setCurrentProfile}
            setCurrentAnswers={setCurrentAnswers}
          />
        );
      case 'results':
        return (
          <ResultsScreen
            navigation={navigation as any}
            route={
              {
                params: {
                  profile: params.profile,
                  answers: params.answersString,
                },
              } as any
            }
            currentProfile={currentProfile}
            currentAnswers={currentAnswers}
          />
        );
      case 'commitment':
        return (
          <CommitmentScreen
            navigation={navigation as any}
            route={
              {
                params: {
                  profile: params.profile,
                  answers: params.answersString,
                  editMode: params.editMode,
                  commitmentId: params.commitmentId,
                  initialText: params.initialText,
                  initialDailyAction: params.initialDailyAction,
                  initialDeadline: params.initialDeadline,
                },
              } as any
            }
          />
        );
      case 'privacyPolicy':
        return <PrivacyPolicyScreen navigation={navigation as any} />;
      case 'dailyCheckIn':
        return (
          <DailyCheckInScreen
            navigation={navigation as any}
            route={{ params: { commitment: params.commitment } } as any}
          />
        );
      case 'publicFeed':
        return <PublicFeedScreen navigation={navigation as any} />;
      case 'lockout':
        return <LockoutScreen navigation={navigation as any} />;
      case 'terms':
        return <TermsScreen navigation={navigation as any} />;
      case 'emailTest':
        return <EmailTestScreen navigation={navigation as any} />;
      default:
        return <LandingScreen navigation={navigation as any} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      {renderScreen()}
    </View>
  );
}
