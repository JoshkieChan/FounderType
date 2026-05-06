import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase, cachedSupabase } from '../lib/cachedSupabase';
import { Commitment } from '../types/commitment';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserContextValue {
  user: { id: string } | null;
  isAuthenticated: boolean;
  activeCommitment: Commitment | null;
  currentSlotStatus: 'none' | 'active';
  lastCycleResult: 'completed' | 'abandoned' | 'none';
  isLoading: boolean;
  error: string | null;
  refreshActiveCommitment: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [activeCommitment, setActiveCommitment] = useState<Commitment | null>(
    null
  );
  const [lastCycleResult, setLastCycleResult] = useState<
    'completed' | 'abandoned' | 'none'
  >('none');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (userId: string) => {
    try {
      setError(null);
      // 1. Fetch active commitment (cached)
      const { data: active, error: activeErr } = await supabase
        .from('commitments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (activeErr) throw activeErr;

      if (active) {
        setActiveCommitment(active as Commitment);
        setLastCycleResult('none'); // Reset history fallback if active exists

        // Keep a lightweight first-commitment check for future receipt logic.
        const { data: previousCommitments } = await supabase
          .from('commitments')
          .select('id')
          .eq('user_id', userId)
          .neq('id', active.id);

        if (!previousCommitments || previousCommitments.length === 0) {
          return;
        }
      } else {
        setActiveCommitment(null);
        // 2. Fetch last result if none active to inform the Landing Page banners (cached)
        const { data: last, error: lastErr } = await supabase
          .from('commitments')
          .select('status, created_at')
          .eq('user_id', userId)
          .in('status', ['completed', 'abandoned'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastErr) throw lastErr;
        setLastCycleResult((last?.status as any) || 'none');

        // Re-engagement is handled by the accountability receipt flow.
      }
    } catch (err) {
      console.error('UserProvider fetchData error:', err);
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id });
        fetchData(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id });
        fetchData(session.user.id);
      } else {
        setUser(null);
        setActiveCommitment(null);
        setLastCycleResult('none');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const refreshActiveCommitment = async () => {
    if (user) {
      // Don't set global isLoading=true here to avoid full-screen flickers on refresh
      await fetchData(user.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // Explicit cleanup of keys we own
    await AsyncStorage.multiRemove([
      'foundertype_has_active_commitment',
      'foundertype_active_commitment_text',
      'foundertype_active_deadline',
      'foundertype_active_commitment',
      'foundertype_has_completed_commitment',
    ]);
  };

  const value: UserContextValue = {
    user,
    isAuthenticated: !!user,
    activeCommitment,
    currentSlotStatus: activeCommitment ? 'active' : 'none',
    lastCycleResult,
    isLoading,
    error,
    refreshActiveCommitment,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
