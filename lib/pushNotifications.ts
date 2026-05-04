import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM format
  achievements: boolean;
  supportAlerts: boolean;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private settings: NotificationSettings = {
    enabled: true,
    dailyReminder: true,
    reminderTime: '09:00',
    achievements: true,
    supportAlerts: true,
  };

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Load saved settings
      await this.loadSettings();

      // Request permissions
      const permission = await this.requestPermissions();
      if (!permission) {
        console.log('Notification permissions denied');
        return false;
      }

      // Schedule daily reminder if enabled
      if (this.settings.dailyReminder) {
        await this.scheduleDailyReminder();
      }

      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false; // Web doesn't support push notifications
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  async saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
      
      // Reschedule daily reminder if time changed
      if (settings.dailyReminder !== undefined || settings.reminderTime) {
        await this.scheduleDailyReminder();
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async scheduleDailyReminder(): Promise<void> {
    try {
      // Cancel existing daily reminder
      await Notifications.cancelScheduledNotificationAsync('daily-reminder');

      if (!this.settings.dailyReminder || !this.settings.enabled) {
        return;
      }

      const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        identifier: 'daily-reminder',
        content: {
          title: 'Daily Check-in Reminder',
          body: 'Don\'t break your streak! Check in with your commitment progress today.',
          data: {
            type: 'daily_reminder',
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log(`Daily reminder scheduled for ${this.settings.reminderTime}`);
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
    }
  }

  async sendAchievementNotification(achievement: string, streak?: number): Promise<void> {
    if (!this.settings.achievements || !this.settings.enabled) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Achievement Unlocked!',
          body: streak 
            ? `Amazing! You've maintained a ${streak}-day streak!`
            : `Congratulations on ${achievement}!`,
          data: {
            type: 'achievement',
            achievement,
            streak,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
    }
  }

  async sendSupportAlert(supporterName: string, commitmentTitle: string): Promise<void> {
    if (!this.settings.supportAlerts || !this.settings.enabled) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 New Support!',
          body: `${supporterName} supported your commitment: ${commitmentTitle}`,
          data: {
            type: 'support_alert',
            supporterName,
            commitmentTitle,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send support alert:', error);
    }
  }

  async sendMissedDayAlert(commitmentTitle: string, daysMissed: number): Promise<void> {
    if (!this.settings.dailyReminder || !this.settings.enabled) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Missed Check-in',
          body: `You missed ${daysMissed} day${daysMissed > 1 ? 's' : ''} for "${commitmentTitle}". Get back on track!`,
          data: {
            type: 'missed_day',
            commitmentTitle,
            daysMissed,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send missed day alert:', error);
    }
  }

  async sendMilestoneNotification(milestone: string, progress: number): Promise<void> {
    if (!this.settings.achievements || !this.settings.enabled) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Milestone Reached!',
          body: `${milestone}: ${progress}% complete! Keep pushing forward!`,
          data: {
            type: 'milestone',
            milestone,
            progress,
          },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Failed to send milestone notification:', error);
    }
  }

  // Get notification token for server-side push notifications
  async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Handle notification responses (when user taps notification)
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { notification } = response;
    const data = notification.request.content.data;

    switch (data.type) {
      case 'daily_reminder':
        // Navigate to daily check-in screen
        console.log('Navigate to daily check-in');
        break;
      case 'achievement':
        // Navigate to achievements screen
        console.log('Navigate to achievements');
        break;
      case 'support_alert':
        // Navigate to commitment details
        console.log('Navigate to commitment:', data.commitmentTitle);
        break;
      case 'missed_day':
        // Navigate to commitment details with check-in prompt
        console.log('Navigate to check-in for:', data.commitmentTitle);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  // Get scheduled notifications count
  async getScheduledNotificationsCount(): Promise<number> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.length;
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const pushNotifications = PushNotificationService.getInstance();