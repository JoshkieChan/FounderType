import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Supabase
jest.mock('./lib/cachedSupabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({ data: null, error: null })
              ),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
  cachedSupabase: {
    getCommitments: jest.fn(() => Promise.resolve([])),
    getUserCommitments: jest.fn(() => Promise.resolve([])),
    getCommitmentById: jest.fn(() => Promise.resolve(null)),
    getUserProfile: jest.fn(() => Promise.resolve(null)),
    getDailyProgress: jest.fn(() => Promise.resolve([])),
    insertCommitment: jest.fn(() => Promise.resolve(null)),
    updateCommitment: jest.fn(() => Promise.resolve(null)),
    deleteCommitment: jest.fn(() => Promise.resolve(null)),
    insertDailyProgress: jest.fn(() => Promise.resolve(null)),
    updateDailyProgress: jest.fn(() => Promise.resolve(null)),
    upsertProfile: jest.fn(() => Promise.resolve(null)),
    updateProfile: jest.fn(() => Promise.resolve(null)),
  },
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'test-url',
      supabaseAnonKey: 'test-key',
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
}));

// Mock SafeAreaProvider
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
