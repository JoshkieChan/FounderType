import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabase';
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
  const sessionUser = useRef<string | null>(null);
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

      if (sessionUser.current !== userId) return;
      if (activeErr) throw activeErr;

      if (active) {
        setActiveCommitment(active as Commitment);
        setLastCycleResult('none'); // Reset history fallback if active exists
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

        if (sessionUser.current !== userId) return;
        if (lastErr) throw lastErr;
        setLastCycleResult((last?.status as any) || 'none');

        // Re-engagement is handled by the accountability receipt flow.
      }
    } catch (err) {
      if (sessionUser.current !== userId) return;
      setError(
        'Could not load your commitment. Check your connection and retry.'
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let receivedAuthEvent = false;
    const applySession = (userId: string | null) => {
      if (!mounted) return;
      if (sessionUser.current !== userId) {
        setActiveCommitment(null);
        setLastCycleResult('none');
      }
      sessionUser.current = userId;
      setUser(userId ? { id: userId } : null);
      if (userId) {
        queueMicrotask(() => {
          if (mounted && sessionUser.current === userId)
            void fetchData(userId).finally(() => {
              if (mounted) setIsLoading(false);
            });
        });
      } else setIsLoading(false);
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      applySession(session?.user.id || null);
    });
    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!receivedAuthEvent) applySession(session?.user.id || null);
      })
      .catch(() => {
        if (mounted) {
          setError('Could not restore your session.');
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
      sessionUser.current = null;
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const refreshActiveCommitment = async () => {
    if (user) {
      // Don't set global isLoading=true here to avoid full-screen flickers on refresh
      await fetchData(user.id);
    }
  };

  const logout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(
      keys.filter((key) => key.startsWith('foundertype_'))
    );
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
