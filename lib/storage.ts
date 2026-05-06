import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Commitment } from '../types/commitment';

const ACTIVE_COMMITMENT_KEY = 'foundertype_active_commitment';

interface Profile {
  founderType?: string;
  founder_type?: string;
  [key: string]: string | undefined;
}

// Save profile for anonymous user
export async function saveProfile(
  userId: string,
  answers: Record<number, string>,
  profile: Profile
) {
  try {
    if (userId.startsWith('local-')) {
      await AsyncStorage.setItem(
        'foundertype_latest_profile',
        JSON.stringify({
          user_id: userId,
          answers,
          founder_type: profile.founderType || profile.founder_type,
          profile,
          created_at: new Date().toISOString(),
        })
      );
      return null;
    }

    const { data, error } = await supabase.from('profiles').insert({
      user_id: userId,
      answers,
      founder_type: profile.founderType || profile.founder_type,
      summary: profile.summary,
      matches: profile.matches,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

// Load profile for anonymous user
export async function loadProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error);
      return null;
    }

    if (!data) return null;

    // Map back to the expected format
    return {
      founderType: data.founder_type,
      summary: data.summary,
      matches: data.matches,
    };
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error;
  }
}

// Get last assessment date for user
export async function getLastAssessmentDate(
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to get last assessment date:', error);
      return null;
    }

    return data?.created_at || null;
  } catch (error) {
    console.error('Error getting last assessment date:', error);
    return null;
  }
}

// Get current authenticated user ID
export async function getCurrentUserId(
  captchaToken?: string | null
): Promise<string | null> {
  try {
    // Check if already signed in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('foundertype_supabase_user_id', user.id);
      }
      return user.id;
    }

    const { data, error } = await supabase.auth.signInAnonymously(
      captchaToken
        ? {
            options: {
              captchaToken,
            },
          }
        : undefined
    );
    if (!error && data.user?.id) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('foundertype_supabase_user_id', data.user.id);
      }
      return data.user.id;
    }

    if (captchaToken) return null;

    // Use local storage fallback only when Supabase anonymous auth is disabled.
    const localUserId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('foundertype_local_user_id');
      if (stored) return stored;
      localStorage.setItem('foundertype_local_user_id', localUserId);
    }

    return localUserId;
  } catch {
    // Fallback to generated ID
    return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Update commitment check-in and return updated count
export async function updateCommitmentCheckIn(
  commitmentId: string,
  userId: string
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  // Skip database operations for local commitments
  if (commitmentId.startsWith('local-')) {
    // Update local commitment in AsyncStorage
    const cachedCommitment = await getCachedActiveCommitment();
    if (cachedCommitment && cachedCommitment.id === commitmentId) {
      const checkIns: string[] = cachedCommitment.check_ins || [];

      if (!checkIns.includes(today)) {
        const updated = [...checkIns, today];
        cachedCommitment.check_ins = updated;
        await AsyncStorage.setItem(
          'foundertype_active_commitment',
          JSON.stringify(cachedCommitment)
        );
        return updated.length;
      }
    }
    return cachedCommitment?.check_ins?.length || 0;
  }

  const { data } = await supabase
    .from('commitments')
    .select('check_ins')
    .eq('id', commitmentId)
    .eq('user_id', userId)
    .single();

  const checkIns: string[] = data?.check_ins || [];

  if (!checkIns.includes(today)) {
    const updated = [...checkIns, today];
    await supabase
      .from('commitments')
      .update({ check_ins: updated })
      .eq('id', commitmentId)
      .eq('user_id', userId);
    return updated.length;
  }

  return checkIns.length;
}

// Cache active commitment locally for quick access in App.tsx
export async function cacheActiveCommitment(commitment: Commitment) {
  await AsyncStorage.setItem(ACTIVE_COMMITMENT_KEY, JSON.stringify(commitment));
}

export async function getCachedActiveCommitment(): Promise<Commitment | null> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_COMMITMENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Fetch the most recent active commitment from Supabase
export async function getActiveCommitment(
  userId: string
): Promise<Commitment | null> {
  try {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    await cacheActiveCommitment(data);
    return data;
  } catch {
    return null;
  }
}
