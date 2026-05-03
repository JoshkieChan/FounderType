import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'foundertype_latest_profile';

interface TopMatch {
  founderType: string;
  score: number;
  description: string;
}

export interface StoredProfile {
  answers: Record<number, string>;
  founderType: string;
  topMatch: TopMatch;
  timestamp: number;
}

export async function storeProfile(profile: StoredProfile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to store profile:', error);
  }
}

export async function getStoredProfile(): Promise<StoredProfile | null> {
  try {
    const profileJson = await AsyncStorage.getItem(PROFILE_KEY);
    if (profileJson) {
      const profile = JSON.parse(profileJson);
      // Clear profiles older than 24 hours
      if (Date.now() - profile.timestamp > 24 * 60 * 60 * 1000) {
        await clearStoredProfile();
        return null;
      }
      return profile;
    }
  } catch (error) {
    console.error('Failed to get stored profile:', error);
  }
  return null;
}

export async function clearStoredProfile() {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error('Failed to clear stored profile:', error);
  }
}
