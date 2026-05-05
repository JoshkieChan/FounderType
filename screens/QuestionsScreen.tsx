import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { FOUNDER_TYPE_QUESTIONS } from '../constants/founderTypeQuestions';
import { UserAnswers } from '../types';
import { useHaptics } from '../hooks/useHaptics';
import { useProgressPersistence } from '../hooks/useProgressPersistence';
import { globalAnswersRef } from '../lib/globalAnswers';

export default function QuestionsScreen({
  navigation,
  setCurrentAnswers,
}: {
  navigation: any;
  setCurrentAnswers: (answers: any) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const { selection, light } = useHaptics();
  const { saveProgress, loadProgress, clearProgress, hasIncompleteSession } =
    useProgressPersistence();

  useEffect(() => {
    const checkProgress = async () => {
      const hasProgress = await hasIncompleteSession();
      if (hasProgress) {
        const progress = await loadProgress();
        if (progress) {
          Alert.alert(
            'Continue Previous Session?',
            'You have an incomplete session from earlier. Would you like to continue where you left off?',
            [
              {
                text: 'Start Over',
                style: 'destructive',
                onPress: () => {
                  clearProgress();
                },
              },
              {
                text: 'Continue',
                onPress: () => {
                  setCurrentQuestion(progress.currentQuestion);
                  setAnswers(progress.answers);
                },
              },
            ]
          );
        }
      }
    };

    checkProgress();
  }, []);

  const handleAnswer = async (answer: string) => {
    selection();
    const newAnswers = {
      ...answers,
      [FOUNDER_TYPE_QUESTIONS[currentQuestion].id]: answer,
    };
    setAnswers(newAnswers);

    // Save progress after each answer
    if (currentQuestion < FOUNDER_TYPE_QUESTIONS.length - 1) {
      await saveProgress(currentQuestion + 1, newAnswers);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Clear progress when completing the assessment
      Sentry.addBreadcrumb({
        message: 'assessment_completed',
        level: 'info',
      });
      await clearProgress();
      setCurrentAnswers(newAnswers);
      const answersString = JSON.stringify(newAnswers);
      // Store in global ref for synchronous access
      globalAnswersRef.current = answersString;
      navigation.navigate('processing', { answers: answersString });
    }
  };

  const handleBack = async () => {
    light();
    if (currentQuestion > 0) {
      const newQuestion = currentQuestion - 1;
      setCurrentQuestion(newQuestion);
      await saveProgress(newQuestion, answers);
    } else {
      await clearProgress();
      navigation.navigate('landing');
    }
  };

  const onGestureEvent = (event: any) => {
    const { translationX } = event.nativeEvent;

    // Swipe left (positive translationX) - go to next question
    if (
      translationX > 50 &&
      currentQuestion < FOUNDER_TYPE_QUESTIONS.length - 1
    ) {
      light();
      setCurrentQuestion(currentQuestion + 1);
    }
    // Swipe right (negative translationX) - go back
    else if (translationX < -50 && currentQuestion > 0) {
      light();
      handleBack();
    }
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      onGestureEvent(event);
    }
  };

  const content = (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {FOUNDER_TYPE_QUESTIONS.map((_: any, index: number) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentQuestion && styles.activeDot,
                index < currentQuestion && styles.completedDot,
              ]}
            />
          ))}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionNumber}>
          Question {currentQuestion + 1} of {FOUNDER_TYPE_QUESTIONS.length}
        </Text>
        <Text style={styles.questionText}>
          {FOUNDER_TYPE_QUESTIONS[currentQuestion].text}
        </Text>

        <View style={styles.optionsContainer}>
          {FOUNDER_TYPE_QUESTIONS[currentQuestion].options.map(
            (option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      {content}
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  activeDot: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  completedDot: {
    backgroundColor: '#3B82F6',
  },
  placeholder: {
    width: 60,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  questionNumber: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 20,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
});
