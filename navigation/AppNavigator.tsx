import React, { useState, useRef } from 'react';
import { View } from 'react-native';
import LandingScreen from '../screens/LandingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import QuestionsScreen from '../screens/QuestionsScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import CommitmentScreen from '../screens/CommitmentScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import ActionPlanScreen from '../screens/ActionPlanScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DailyCheckInScreen from '../screens/DailyCheckInScreen';
import ReassessmentScreen from '../screens/ReassessmentScreen';
import NextLevelScreen from '../screens/NextLevelScreen';
import PublicFeedScreen from '../screens/PublicFeedScreen';

type Screen =
  | 'landing'
  | 'onboarding'
  | 'questions'
  | 'processing'
  | 'results'
  | 'commitment'
  | 'upgrade'
  | 'actionPlan'
  | 'privacy'
  | 'dailyCheckIn'
  | 'reassessment'
  | 'nextLevel'
  | 'publicFeed';

interface NavigationParams {
  answers?: string;
  profile?: string;
  answersString?: string;
  founderType?: string;
  topMatch?: any;
  commitment?: any;
  commitmentText?: string;
  isPublicCommitment?: boolean;
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
  commitment: { profile?: string; answers?: string };
  upgrade: { profile?: string; answers?: string; commitment?: any; commitmentText?: string; isPublicCommitment?: boolean };
  actionPlan: { answers?: string; founderType?: string; topMatch?: any };
  privacy: undefined;
  dailyCheckIn: undefined;
  reassessment: undefined;
  nextLevel: undefined;
  publicFeed: undefined;
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
            route={{ params: { profile: params.profile, answers: params.answersString } } as any}
          />
        );
      case 'upgrade':
        return (
          <UpgradeScreen
            navigation={navigation as any}
            route={{
              params: {
                profile: params.profile,
                answers: params.answersString,
                commitment: params.commitment,
                commitmentText: params.commitmentText,
                isPublicCommitment: params.isPublicCommitment,
              },
            } as any}
            currentProfile={currentProfile}
            currentAnswers={currentAnswers}
          />
        );
      case 'actionPlan':
        return (
          <ActionPlanScreen
            navigation={navigation as any}
            route={{ params: { answers: params.answers, founderType: params.founderType, topMatch: params.topMatch } } as any}
            currentProfile={currentProfile}
            currentAnswers={currentAnswers}
          />
        );
      case 'privacy':
        return <PrivacyPolicyScreen navigation={navigation as any} />;
      case 'dailyCheckIn':
        return <DailyCheckInScreen navigation={navigation as any} />;
      case 'reassessment':
        return <ReassessmentScreen navigation={navigation as any} />;
      case 'nextLevel':
        return <NextLevelScreen navigation={navigation as any} />;
      case 'publicFeed':
        return <PublicFeedScreen navigation={navigation as any} />;
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
