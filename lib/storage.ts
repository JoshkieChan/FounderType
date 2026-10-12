import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Commitment } from '../types/commitment';

const ACTIVE_COMMITMENT_KEY = 'foundertype_active_commitment';

interface Profile {
  founderType?: string;
  founder_type?: string;
  summary?: string;
  headline?: string;
  matches?: unknown[];
  [key: string]: unknown;
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
      summary: profile.summary || profile.headline || '',
      matches: profile.matches || [],
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) return user.id;
  // Reading a screen must not silently create accounts or bypass CAPTCHA.
  if (captchaToken) {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { captchaToken },
    });
    if (error || !data.user)
      throw new Error(
        'Unable to create a secure session. Complete the security check again.'
      );
    return data.user.id;
  }
  const existing = await AsyncStorage.getItem('foundertype_local_user_id');
  if (existing) return existing;
  const id = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  await AsyncStorage.setItem('foundertype_local_user_id', id);
  return id;
}

// A single database transaction persists progress and returns the authoritative row.
export async function recordCheckIn(commitmentId: string): Promise<Commitment> {
  const { data, error } = await supabase
    .rpc('record_check_in', {
      target_id: commitmentId,
    })
    .single();
  if (error || !data)
    throw new Error(
      'Could not save your check-in. Please retry when connected.'
    );
  return data as Commitment;
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
