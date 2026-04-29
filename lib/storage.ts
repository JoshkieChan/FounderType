import { supabase } from './supabase';

// Save profile for anonymous user
export async function saveProfile(userId: string, answers: Record<number, string>, profile: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        answers,
        profile,
        assessed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
    
    console.log('Profile saved successfully');
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
      .single();

    if (error) {
      console.error('Failed to load profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error loading profile:', error);
    throw error;
  }
}

// Get last assessment date for user
export async function getLastAssessmentDate(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('assessed_at')
      .eq('user_id', userId)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to get last assessment date:', error);
      return null;
    }

    return data?.assessed_at || null;
  } catch (error) {
    console.error('Error getting last assessment date:', error);
    return null;
  }
}

// Get current authenticated user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}
