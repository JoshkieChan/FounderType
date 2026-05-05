import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  calculateFounderType,
  FOUNDER_TYPE_RESULTS,
} from '../constants/founderTypeQuestions';
import { useProgressPersistence } from '../hooks/useProgressPersistence';
import { globalAnswersRef } from '../lib/globalAnswers';

export default function ProcessingScreen({
  route,
  navigation,
  setCurrentProfile,
  setCurrentAnswers,
}: {
  route: any;
  navigation: any;
  setCurrentProfile: (profile: any) => void;
  setCurrentAnswers: (answers: any) => void;
}) {
  const { answers } = route.params;

  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [retryCount, setRetryCount] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [profileGenerated, setProfileGenerated] = useState(false);
  const { clearProgress } = useProgressPersistence();

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  const subtitles = [
    'Analyzing your answers...',
    'Mapping your founder psychology...',
    'Calculating business model fit...',
    'Generating your honest profile...',
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
    };

    createPulse(pulse1, 0).start();
    createPulse(pulse2, 600).start();
    createPulse(pulse3, 1200).start();

    const subtitleInterval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 3000);

    const generateProfile = async () => {
      try {
        const parsedAnswers = JSON.parse(answers || '{}');

        if (Object.keys(parsedAnswers).length === 0) {
          console.error('No answers provided - cannot generate profile');
          setError(true);
          return;
        }

        // Calculate Founder Type locally
        const founderType = calculateFounderType(parsedAnswers);
        const profile =
          FOUNDER_TYPE_RESULTS[
            founderType as keyof typeof FOUNDER_TYPE_RESULTS
          ];

        if (!profile) {
          setError(true);
          return;
        }

        setTimeout(() => {
          setCurrentProfile({ founderType, ...profile });
          setCurrentAnswers(answers);
          navigation.navigate('results', {
            profile: JSON.stringify({ founderType, ...profile }),
            answers: answers,
          });
        }, 1000);
      } catch (e) {
        console.error('Error generating profile:', e);
        setError(true);
      }
    };

    // Only generate if we have answers
    if (answers) {
      generateProfile();
    } else {
    }

    return () => {
      clearInterval(subtitleInterval);
    };
  }, [answers, fadeAnim]);

  const handleRetry = useCallback(() => {
    setError(false);
    setSubtitleIndex(0);
    setRetryCount((c) => c + 1);
  }, []);

  // Handle globalAnswersRef changes separately
  useEffect(() => {
    if (answers) return; // Already have answers from route.params

    const checkGlobalAnswers = () => {
      const globalAnswers = globalAnswersRef.current;
      if (globalAnswers && !profileGenerated) {
        const generateProfile = async () => {
          try {
            const parsedAnswers = JSON.parse(globalAnswers);

            if (Object.keys(parsedAnswers).length === 0) {
              console.error('No answers provided - cannot generate profile');
              setError(true);
              return;
            }

            // Calculate Founder Type locally
            const founderType = calculateFounderType(parsedAnswers);
            const profile =
              FOUNDER_TYPE_RESULTS[
                founderType as keyof typeof FOUNDER_TYPE_RESULTS
              ];
            setProfileGenerated(true);

            if (!profile) {
              setError(true);
              return;
            }

            setTimeout(() => {
              setCurrentProfile({ founderType, ...profile });
              navigation.navigate('results', {
                profile: JSON.stringify({ founderType, ...profile }),
              });
            }, 1000);
          } catch (e) {
            console.error('Error generating profile:', e);
            setError(true);
          }
        };

        generateProfile();
        clearInterval(interval);
      }
    };

    const interval = setInterval(checkGlobalAnswers, 100);
    return () => clearInterval(interval);
  }, [answers, profileGenerated, setCurrentProfile, navigation]);

  useEffect(() => {
    if (retryCount > 0 && !error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);

      const createPulse = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ])
        );
      };

      createPulse(pulse1, 0).start();
      createPulse(pulse2, 600).start();
      createPulse(pulse3, 1200).start();

      setSubtitleIndex(0);
      const subtitleInterval = setInterval(() => {
        setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
      }, 3000);

      const generateProfile = async () => {
        try {
          const parsedAnswers = JSON.parse(answers || '{}');
          // Calculate Founder Type locally
          const founderType = calculateFounderType(parsedAnswers);
          const profile =
            FOUNDER_TYPE_RESULTS[
              founderType as keyof typeof FOUNDER_TYPE_RESULTS
            ];

          if (!profile) {
            setError(true);
            return;
          }

          setTimeout(() => {
            navigation.navigate('results', {
              profile: JSON.stringify({ founderType, ...profile }),
            });
          }, 1000);
        } catch (e) {
          console.error('Error generating profile:', e);
          setError(true);
        }
      };

      generateProfile();

      return () => {
        clearInterval(subtitleInterval);
      };
    }
  }, [retryCount, answers, fadeAnim, navigation, error]);

  if (error) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>AI Service Unavailable</Text>
          <Text style={styles.errorText}>
            Our AI service is temporarily overloaded. Please try again in a few
            minutes.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              // Clear all stored data and reset state
              clearProgress();
              navigation.navigate('questions');
            }}
          >
            <Text style={styles.cancelButtonText}>Start Over</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const circleScale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.8],
  });
  const circleOpacity1 = pulse1.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.7, 0.3, 0],
  });
  const circleScale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.8],
  });
  const circleOpacity2 = pulse2.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.7, 0.3, 0],
  });
  const circleScale3 = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.8],
  });
  const circleOpacity3 = pulse3.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.7, 0.3, 0],
  });

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.pulseContainer}>
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: circleScale1 }], opacity: circleOpacity1 },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: circleScale2 }], opacity: circleOpacity2 },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: circleScale3 }], opacity: circleOpacity3 },
            ]}
          />
          <View style={styles.pulseCenter} />
        </View>

        <Text style={styles.title}>Building your FounderType profile...</Text>
        <Text style={styles.subtitle}>{subtitles[subtitleIndex]}</Text>
      </Animated.View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pulseContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
  },
  pulseCenter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    minHeight: 22,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
});
