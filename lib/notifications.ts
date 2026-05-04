import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  dailyCheckIn: boolean;
  achievements: boolean;
  reminders: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyCheckIn: true,
  achievements: true,
  reminders: true,
};

export class NotificationService {
  static async initialize() {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    return true;
  }

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem('notification_settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  static async scheduleDailyCheckIn(hour: number = 9, minute: number = 0): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.dailyCheckIn) return;

      // Cancel existing daily check-in notifications
      await this.cancelNotification('daily-checkin');

      // Schedule new daily notification
      const trigger = new Date();
      trigger.setHours(hour, minute, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (trigger <= new Date()) {
        trigger.setDate(trigger.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-checkin',
        content: {
          title: 'Daily Check-in Time!',
          body: 'How did you do on your commitment today? Log your progress now.',
          data: { type: 'daily-checkin' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily check-in:', error);
    }
  }

  static async sendAchievementNotification(title: string, message: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.achievements) return;

      await Notifications.scheduleNotificationAsync({
        identifier: `achievement-${Date.now()}`,
        content: {
          title,
          body: message,
          data: { type: 'achievement' },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending achievement notification:', error);
    }
  }

  static async sendReminderNotification(title: string, message: string): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.reminders) return;

      await Notifications.scheduleNotificationAsync({
        identifier: `reminder-${Date.now()}`,
        content: {
          title,
          body: message,
          data: { type: 'reminder' },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending reminder notification:', error);
    }
  }

  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

// Legacy function for compatibility
export const sendMissedDaysAlert = async (daysMissed: number, commitmentText: string) => {
  if (daysMissed > 0) {
    await NotificationService.sendReminderNotification(
      'Missed Check-ins!',
      `You missed ${daysMissed} day${daysMissed > 1 ? 's' : ''} for: "${commitmentText.substring(0, 50)}..."`
    );
  }
};