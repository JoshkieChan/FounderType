import React, { useState } from 'react';
import { View } from 'react-native';
import LandingScreen from '../screens/LandingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import QuestionsScreen from '../screens/QuestionsScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import ActionPlanScreen from '../screens/ActionPlanScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

type Screen = 'landing' | 'onboarding' | 'questions' | 'processing' | 'results' | 'upgrade' | 'actionPlan' | 'privacy';

interface NavigationParams {
  answers?: Record<number, string>;
  profile?: string;
  answersString?: string;
  founderType?: string;
  topMatch?: any;
}

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [params, setParams] = useState<NavigationParams>({});

  const navigate = (screen: Screen, newParams?: NavigationParams) => {
    setParams(newParams || {});
    setCurrentScreen(screen);
  };

  const navigation = { navigate };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen navigation={navigation as any} />;
      case 'onboarding':
        return <OnboardingScreen navigation={navigation as any} />;
      case 'questions':
        return <QuestionsScreen navigation={navigation as any} />;
      case 'processing':
        return <ProcessingScreen navigation={navigation as any} route={{ params: { answers: params.answersString } } as any} />;
      case 'results':
        return <ResultsScreen navigation={navigation as any} route={{ params: { profile: params.profile, answers: params.answersString } } as any} />;
      case 'upgrade':
        return <UpgradeScreen navigation={navigation as any} />;
      case 'actionPlan':
        return <ActionPlanScreen navigation={navigation as any} route={{ params: { answers: params.answers, founderType: params.founderType, topMatch: params.topMatch } } as any} />;
      case 'privacy':
        return <PrivacyPolicyScreen navigation={navigation as any} />;
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

