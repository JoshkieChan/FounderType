import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAnswers } from '../types';

const PROGRESS_KEY = 'foundertype_progress';
const LAST_SESSION_KEY = 'foundertype_last_session';

interface ProgressData {
  currentQuestion: number;
  answers: UserAnswers;
  timestamp: number;
  sessionCompleted: boolean;
}

// AsyncStorage is now available
const checkAsyncStorageAvailable = () => true;

export function useProgressPersistence() {
  const saveProgress = async (
    currentQuestion: number,
    answers: UserAnswers
  ) => {
    if (!checkAsyncStorageAvailable()) {
      console.warn('AsyncStorage not available, progress not saved');
      return;
    }

    try {
      const progressData: ProgressData = {
        currentQuestion,
        answers,
        timestamp: Date.now(),
        sessionCompleted: false,
      };

      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progressData));
      await AsyncStorage.setItem(LAST_SESSION_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const loadProgress = async (): Promise<ProgressData | null> => {
    if (!checkAsyncStorageAvailable()) {
      console.warn('AsyncStorage not available, no progress loaded');
      return null;
    }

    try {
      const progressJson = await AsyncStorage.getItem(PROGRESS_KEY);
      if (!progressJson) return null;

      const progress: ProgressData = JSON.parse(progressJson);

      // Clear progress if it's older than 24 hours
      const isExpired = Date.now() - progress.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        await clearProgress();
        return null;
      }

      return progress;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  };

  const clearProgress = async () => {
    if (!checkAsyncStorageAvailable()) {
      console.warn('AsyncStorage not available, no progress cleared');
      return;
    }

    try {
      await AsyncStorage.removeItem(PROGRESS_KEY);
      await AsyncStorage.removeItem(LAST_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  };

  const markSessionCompleted = async () => {
    if (!checkAsyncStorageAvailable()) {
      console.warn('AsyncStorage not available, session not marked');
      return;
    }

    try {
      const progressJson = await AsyncStorage.getItem(PROGRESS_KEY);
      if (progressJson) {
        const progress: ProgressData = JSON.parse(progressJson);
        progress.sessionCompleted = true;
        await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      }
    } catch (error) {
      console.error('Failed to mark session completed:', error);
    }
  };

  const hasIncompleteSession = async (): Promise<boolean> => {
    try {
      const progress = await loadProgress();
      return progress !== null && !progress.sessionCompleted;
    } catch (error) {
      return false;
    }
  };

  const getLastSessionTime = async (): Promise<number | null> => {
    if (!checkAsyncStorageAvailable()) {
      console.warn('AsyncStorage not available, no session time');
      return null;
    }

    try {
      const lastSession = await AsyncStorage.getItem(LAST_SESSION_KEY);
      return lastSession ? parseInt(lastSession, 10) : null;
    } catch (error) {
      return null;
    }
  };

  return {
    saveProgress,
    loadProgress,
    clearProgress,
    markSessionCompleted,
    hasIncompleteSession,
    getLastSessionTime,
  };
}
