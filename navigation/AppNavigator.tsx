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
import UnlockScreen from '../screens/UnlockScreen';
import LockoutScreen from '../screens/LockoutScreen';

type Screen =
  | 'landing'
  | 'onboarding'
  | 'questions'
  | 'processing'
  | 'results'
  | 'commitment'
  | 'privacy'
  | 'dailyCheckIn'
  | 'publicFeed'
  | 'unlockScreen'
  | 'lockoutScreen';

interface NavigationParams {
  answers?: string;
  profile?: string;
  answersString?: string;
  founderType?: string;
  topMatch?: any;
  commitment?: any;
  commitmentText?: string;
  isPublicCommitment?: boolean;
  editMode?: boolean;
  commitmentId?: string;
  initialText?: string;
  initialDailyAction?: string;
  initialDeadline?: string;
}

interface AppNavigatorProps {
  currentProfile: any;
  setCurrentProfile: (profile: any) => void;
  currentAnswers: any;
  setCurrentAnswers: (answers: any) => void;
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
  privacy: undefined;
  dailyCheckIn: { commitment?: any } | undefined;
  publicFeed: undefined;
  unlockScreen: undefined;
  lockoutScreen: undefined;
};

export default function AppNavigator({
  currentProfile,
  setCurrentProfile,
  currentAnswers,
  setCurrentAnswers,
  globalAnswersRef,
}: AppNavigatorProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [params, setParams] = useState<NavigationParams>({});
  const [directParams, setDirectParams] = useState<NavigationParams | null>(null);
  const [history, setHistory] = useState<{screen: Screen, params: NavigationParams}[]>([]);

  const navigate = (screen: Screen, newParams?: NavigationParams) => {
    console.log('AppNavigator navigate - screen:', screen, 'newParams:', newParams);
    setHistory(prev => [...prev, {screen: currentScreen, params}]);
    setDirectParams(newParams || null);
    setParams(newParams || {});
    setCurrentScreen(screen);
  };

  const goBack = () => {
    setHistory(prev => {
      const newHistory = [...prev];
      const last = newHistory.pop();
      if (last) {
        setCurrentScreen(last.screen);
        setParams(last.params);
        setDirectParams(last.params);
      } else {
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
        return <QuestionsScreen navigation={navigation as any} setCurrentAnswers={setCurrentAnswers} />;
      case 'processing':
        return (
          <ProcessingScreen
            navigation={navigation as any}
            route={{ params: { answers: directParams?.answers || params.answers } } as any}
            setCurrentProfile={setCurrentProfile}
            setCurrentAnswers={setCurrentAnswers}
          />
        );
      case 'results':
        return (
          <ResultsScreen
            navigation={navigation as any}
            route={{ params: { profile: params.profile, answers: params.answersString } } as any}
            currentProfile={currentProfile}
            currentAnswers={currentAnswers}
          />
        );
      case 'commitment':
        return (
          <CommitmentScreen
            navigation={navigation as any}
            route={{
              params: {
                profile: params.profile,
                answers: params.answersString,
                editMode: params.editMode,
                commitmentId: params.commitmentId,
                initialText: params.initialText,
                initialDailyAction: params.initialDailyAction,
                initialDeadline: params.initialDeadline,
              },
            } as any}
          />
        );
      case 'privacy':
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
      case 'unlockScreen':
        return <UnlockScreen navigation={navigation as any} />;
      case 'lockoutScreen':
        return <LockoutScreen navigation={navigation as any} />;
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
