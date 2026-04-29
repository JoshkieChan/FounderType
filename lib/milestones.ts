import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MilestoneConfig {
  id: string;
  icon: string;
  headline: string;
  subtext: string;
  showShareButton?: boolean;
}

export const MILESTONES: Record<string, MilestoneConfig> = {
  ASSESSMENT_COMPLETE: {
    id: 'ASSESSMENT_COMPLETE',
    icon: ' ',
    headline: 'Your FounderType is ready',
    subtext: 'Most people never get this far. You did.',
  },
  FIRST_ACTION_COMPLETE: {
    id: 'FIRST_ACTION_COMPLETE',
    icon: ' ',
    headline: 'Day 1 done.',
    subtext: 'That\'s more than 80% of people who downloaded this app.',
  },
  WEEK_1_COMPLETE: {
    id: 'WEEK_1_COMPLETE',
    icon: ' ',
    headline: 'One week in.',
    subtext: 'You\'re building real momentum. Most people quit by now.',
  },
  FULL_30_DAYS_COMPLETE: {
    id: 'FULL_30_DAYS_COMPLETE',
    icon: ' ',
    headline: 'You finished.',
    subtext: '30 days of consistent action. You\'re not the same founder you were when you started.',
    showShareButton: true,
  },
};

export async function hasMilestoneBeenShown(milestoneId: string): Promise<boolean> {
  try {
    const milestones = await AsyncStorage.getItem('foundertype_milestones');
    const milestoneData = milestones ? JSON.parse(milestones) : {};
    return milestoneData[milestoneId] === true;
  } catch (error) {
    console.error('Error checking milestone:', error);
    return false;
  }
}

export async function markMilestoneAsShown(milestoneId: string): Promise<void> {
  try {
    const milestones = await AsyncStorage.getItem('foundertype_milestones');
    const milestoneData = milestones ? JSON.parse(milestones) : {};
    milestoneData[milestoneId] = true;
    await AsyncStorage.setItem('foundertype_milestones', JSON.stringify(milestoneData));
  } catch (error) {
    console.error('Error marking milestone:', error);
  }
}

export async function checkMilestones(completedDays: number[]): Promise<string[]> {
  const newMilestones: string[] = [];

  // Check MILESTONE 1: Assessment Complete (handled separately)
  
  // Check MILESTONE 2: First Action Complete
  if (completedDays.length === 1) {
    const hasBeenShown = await hasMilestoneBeenShown(MILESTONES.FIRST_ACTION_COMPLETE.id);
    if (!hasBeenShown) {
      newMilestones.push(MILESTONES.FIRST_ACTION_COMPLETE.id);
    }
  }

  // Check MILESTONE 3: Week 1 Complete
  if (completedDays.length >= 7) {
    const hasBeenShown = await hasMilestoneBeenShown(MILESTONES.WEEK_1_COMPLETE.id);
    if (!hasBeenShown) {
      newMilestones.push(MILESTONES.WEEK_1_COMPLETE.id);
    }
  }

  // Check MILESTONE 4: Full 30 Days Complete
  if (completedDays.length >= 30) {
    const hasBeenShown = await hasMilestoneBeenShown(MILESTONES.FULL_30_DAYS_COMPLETE.id);
    if (!hasBeenShown) {
      newMilestones.push(MILESTONES.FULL_30_DAYS_COMPLETE.id);
    }
  }

  return newMilestones;
}
