import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateNextLevelProfile } from '../lib/gemini';
import * as Sentry from '@sentry/react-native';

export default function NextLevelProcessingScreen({ navigation, route }: { navigation: any; route?: any }) {
  const profile = route?.params?.profile;
  const originalAnswers = route?.params?.originalAnswers;
  const nextLevelAnswers = route?.params?.nextLevelAnswers;

  useEffect(() => {
    const processNextLevelProfile = async () => {
      try {
        Sentry.addBreadcrumb({
          message: 'next_level_processing_started',
          level: 'info',
          data: {
            originalAnswersCount: Object.keys(originalAnswers || {}).length,
            nextLevelAnswersCount: Object.keys(nextLevelAnswers || {}).length,
          }
        });

        const nextLevelProfile = await generateNextLevelProfile(originalAnswers, nextLevelAnswers);

        if (nextLevelProfile) {
          navigation.navigate('nextLevelResults', {
            profile: nextLevelProfile,
            originalProfile: profile,
            originalAnswers,
            nextLevelAnswers
          });
        } else {
          throw new Error('Failed to generate next level profile');
        }
      } catch (error) {
        console.error('Next Level processing error:', error);
        Sentry.captureException(error);
        navigation.goBack();
      }
    };

    // Add a small delay to show the processing screen
    const timer = setTimeout(() => {
      processNextLevelProfile();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, originalAnswers, nextLevelAnswers, profile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
        <Text style={styles.title}>Going deeper into your profile...</Text>
        <Text style={styles.subtitle}>Analyzing your responses for a more precise assessment</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinner: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
});
