import { createClient } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const missingSupabaseError = {
  message:
    'Supabase is not configured for this deployment. Configure the public Supabase settings, then rebuild.',
};

const createMissingSupabaseQuery = (): any => {
  const result = Promise.resolve({ data: null, error: missingSupabaseError });
  return new Proxy(result, {
    get(target, prop) {
      if (prop in target) {
        const value = (target as any)[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      }
      return () => createMissingSupabaseQuery();
    },
  });
};

const missingSupabaseClient = {
  auth: {
    getUser: async () => ({
      data: { user: null },
      error: missingSupabaseError,
    }),
    getSession: async () => ({
      data: { session: null },
      error: missingSupabaseError,
    }),
    signInAnonymously: async () => ({
      data: { user: null, session: null },
      error: missingSupabaseError,
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => createMissingSupabaseQuery(),
  rpc: () => createMissingSupabaseQuery(),
  functions: {
    invoke: async () => ({ data: null, error: missingSupabaseError }),
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        detectSessionInUrl: Platform.OS === 'web',
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (missingSupabaseClient as unknown as ReturnType<typeof createClient>);
