import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { generateFounderProfile } from '../lib/gemini';
import { useProgressPersistence } from '../hooks/useProgressPersistence';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProcessingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'processing'>;
type ProcessingScreenRouteProp = RouteProp<RootStackParamList, 'processing'>;

export default function ProcessingScreen({ route, navigation }: { 
  route: ProcessingScreenRouteProp; 
  navigation: ProcessingScreenNavigationProp 
}) {
  const { answers } = route.params;
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [retryCount, setRetryCount] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  const subtitles = [
    'Analyzing your answers...',
    'Mapping your founder psychology...',
    'Calculating business model fit...',
    'Generating your honest profile...'
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createPulse(pulse1, 0).start();
    createPulse(pulse2, 600).start();
    createPulse(pulse3, 1200).start();

    const subtitleInterval = setInterval(() => {
      setSubtitleIndex(prev => (prev + 1) % subtitles.length);
    }, 3000);

    const generateProfile = async () => {
      try {
        const parsedAnswers = JSON.parse(answers || '{}');
        const profile = await generateFounderProfile(parsedAnswers);

        if (!profile || profile.error) {
          setError(true);
          return;
        }

        setTimeout(() => {
          navigation.navigate('results', { profile: JSON.stringify(profile) });
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
  }, [answers, fadeAnim]);

  const handleRetry = useCallback(() => {
    setError(false);
    setSubtitleIndex(0);
    setRetryCount(c => c + 1);
  }, []);

  useEffect(() => {
    if (retryCount > 0 && !error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
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
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      createPulse(pulse1, 0).start();
      createPulse(pulse2, 600).start();
      createPulse(pulse3, 1200).start();

      setSubtitleIndex(0);
      const subtitleInterval = setInterval(() => {
        setSubtitleIndex(prev => (prev + 1) % subtitles.length);
      }, 3000);

      const generateProfile = async () => {
        try {
          const parsedAnswers = JSON.parse(answers || '{}');
          const profile = await generateFounderProfile(parsedAnswers);

          if (!profile) {
            setError(true);
            return;
          }

          setTimeout(() => {
            navigation.navigate('results', { profile: JSON.stringify(profile) });
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
            Our AI service is temporarily overloaded. Please try again in a few minutes.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            // Clear all stored data and reset state
            clearProgress();
            navigation.navigate('questions');
          }}>
            <Text style={styles.cancelButtonText}>Start Over</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const circleScale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.8] });
  const circleOpacity1 = pulse1.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 0.3, 0] });
  const circleScale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.8] });
  const circleOpacity2 = pulse2.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 0.3, 0] });
  const circleScale3 = pulse3.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.8] });
  const circleOpacity3 = pulse3.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 0.3, 0] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.pulseContainer}>
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: circleScale1 }], opacity: circleOpacity1 }
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: circleScale2 }], opacity: circleOpacity2 }
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: circleScale3 }], opacity: circleOpacity3 }
            ]}
          />
          <View style={styles.pulseCenter} />
        </View>

        <Text style={styles.title}>Building your FounderType profile...</Text>
        <Text style={styles.subtitle}>{subtitles[subtitleIndex]}</Text>
      </Animated.View>
    </View>
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
