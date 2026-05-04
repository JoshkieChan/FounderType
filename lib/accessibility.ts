import { Platform } from 'react-native';
import Logger from './logger';

export const accessibilityLabels = {
  // Navigation
  goBack: 'Go back to previous screen',
  menu: 'Open navigation menu',
  close: 'Close dialog or modal',
  
  // Commitment actions
  makeCommitment: 'Create new commitment',
  editCommitment: 'Edit existing commitment',
  deleteCommitment: 'Delete commitment',
  saveCommitment: 'Save commitment changes',
  
  // Form fields
  commitmentInput: 'Enter your commitment text',
  dailyActionInput: 'Enter your daily action',
  deadlineInput: 'Enter commitment deadline',
  
  // Feed actions
  refreshFeed: 'Refresh commitment feed',
  loadMore: 'Load more commitments',
  shareProfile: 'Share your profile',
  
  // Common actions
  submit: 'Submit form',
  cancel: 'Cancel action',
  confirm: 'Confirm action',
  retry: 'Retry operation',
};

export const accessibilityHints = {
  commitmentInput: 'Enter what you want to commit to achieve',
  dailyActionInput: 'Enter what you will do daily to reach your commitment',
  deadlineInput: 'Enter the date when your commitment should be completed',
  deleteCommitment: 'This will permanently remove your commitment',
  shareProfile: 'Share your commitment profile with others',
};

export const accessibilityRoles = {
  button: 'button',
  header: 'header',
  text: 'text',
  image: 'image',
  link: 'link',
  search: 'searchbox',
  combobox: 'combobox',
  list: 'list',
  listitem: 'listitem',
};

export function getAccessibilityLabel(key: keyof typeof accessibilityLabels): string {
  return accessibilityLabels[key];
}

export function getAccessibilityHint(key: keyof typeof accessibilityHints): string {
  return accessibilityHints[key];
}

export function announceToScreenReader(message: string) {
  if (Platform.OS === 'web' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  } else if (Platform.OS !== 'web') {
    // For React Native, you would use a library like react-native-accessibility-service
    Logger.info('Screen reader announcement:', message);
  }
}

export function isScreenReaderEnabled(): boolean {
  if (Platform.OS === 'web') {
    // Check if screen reader is enabled on web
    return false; // Would need proper implementation
  }
  // For React Native, use AccessibilityInfo.isScreenReaderEnabled()
  return false;
}
