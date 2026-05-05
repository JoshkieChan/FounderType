import { createClient } from '@supabase/supabase-js';
import Logger from './logger';

declare global {
  interface Window {
    __FOUNDER_TYPE_ENV__?: {
      EXPO_PUBLIC_SUPABASE_URL?: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      NEXT_PUBLIC_SUPABASE_KEY?: string;
    };
  }
}

const runtimeEnv =
  typeof window !== 'undefined' ? window.__FOUNDER_TYPE_ENV__ : undefined;

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  runtimeEnv?.EXPO_PUBLIC_SUPABASE_URL ||
  runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  runtimeEnv?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  runtimeEnv?.NEXT_PUBLIC_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const missingSupabaseError = {
  message:
    'Supabase is not configured for this deployment. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.',
};

const createMissingSupabaseQuery = (): any => {
  const result = Promise.resolve({ data: null, error: missingSupabaseError });
  return new Proxy(result, {
    get(target, prop) {
      if (prop in target) return (target as any)[prop];
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
  functions: {
    invoke: async () => ({ data: null, error: missingSupabaseError }),
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (missingSupabaseClient as unknown as ReturnType<typeof createClient>);

// Test connection
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    Logger.error(missingSupabaseError.message);
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .single();
    if (error) {
      Logger.error('Supabase connection test failed:', error.message);
      return false;
    }
    Logger.info('Supabase connection successful');
    return true;
  } catch (e) {
    Logger.error('Supabase connection error:', e);
    return false;
  }
};
