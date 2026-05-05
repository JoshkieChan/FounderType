import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trackFunnelEvent } from '../lib/funnelAnalytics';

interface OnboardingScreenProps {
  navigation?: {
    navigate: (screen: string, params?: any) => void;
  };
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'You Keep Starting. You Keep Stopping.',
    description:
      "FounderType is for repeat starters who know what they should do and still don't do it. Not because you're lazy. Because your stopping pattern has never been named.",
    icon: 'scan-outline',
    color: '#3B82F6',
  },
  {
    id: 2,
    title: 'First We Name The Pattern',
    description:
      'Seven honest questions reveal how you actually behave as a builder: your operating style, your fear pattern, and the exact loop that makes you quit.',
    icon: 'finger-print-outline',
    color: '#A78BFA',
  },
  {
    id: 3,
    title: 'Then You Put Your Word On Record',
    description:
      'Before the plan, you make one public 30-day commitment. Anonymous, but visible. Quitting stops being a private disappointment.',
    icon: 'document-text-outline',
    color: '#FBBF24',
  },
  {
    id: 4,
    title: 'Follow Through Or Face The Record',
    description:
      'Every week, FounderType reflects your specific pattern back to you. Not motivation. A mirror. Recommit, complete it, or admit you quit.',
    icon: 'eye-outline',
    color: '#EF4444',
  },
];

const Container = Platform.OS === 'web' ? View : SafeAreaView;

export default function OnboardingScreen({
  navigation,
}: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    trackFunnelEvent('product_hunt_onboarding_start');
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation?.navigate?.('questions');
    }
  };

  const handleSkip = () => {
    if (navigation?.navigate) {
      navigation.navigate('landing');
    } else {
      console.log('Onboarding completed');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = onboardingSteps[currentStep];

  return (
    <Container style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>View home</Text>
          </TouchableOpacity>

          <View style={styles.progressIndicator}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: step.color + '20', borderColor: step.color },
            ]}
          >
            <Ionicons name={step.icon} size={80} color={step.color} />
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#6b7280" />
            </TouchableOpacity>
          )}
          {currentStep === 0 && <View style={styles.backButtonPlaceholder} />}

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {currentStep === onboardingSteps.length - 1
                ? 'Start Diagnostic'
                : 'Next'}
            </Text>
            <Ionicons
              name={
                currentStep === onboardingSteps.length - 1
                  ? 'checkmark'
                  : 'chevron-forward'
              }
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  description: {
    fontSize: 17,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
