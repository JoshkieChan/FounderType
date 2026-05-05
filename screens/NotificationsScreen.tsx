import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NotificationService,
  NotificationSettings,
} from '../lib/notifications';

export default function NotificationsScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyCheckIn: true,
    achievements: true,
    reminders: true,
  });
  const [loading, setLoading] = useState(true);
  const [scheduledNotifications, setScheduledNotifications] = useState<
    string[]
  >([]);

  useEffect(() => {
    loadSettings();
    loadScheduledNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const notificationSettings = await NotificationService.getSettings();
      setSettings(notificationSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      const notifications =
        await NotificationService.getScheduledNotifications();
      setScheduledNotifications(
        notifications
          .map((n) => n.content.title)
          .filter((title): title is string => Boolean(title))
      );
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    try {
      await NotificationService.updateSettings({ [key]: value });
      setSettings((prev) => ({ ...prev, [key]: value }));

      // If disabling daily check-in, cancel the notification
      if (key === 'dailyCheckIn' && !value) {
        await NotificationService.cancelNotification('daily-checkin');
      } else if (key === 'dailyCheckIn' && value) {
        // Re-enable daily check-in
        await NotificationService.scheduleDailyCheckIn();
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
    }
  };

  const testNotification = async () => {
    await NotificationService.sendAchievementNotification(
      'Test Notification',
      'This is a test notification from FounderType!'
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Daily Check-in Reminders</Text>
              <Text style={styles.settingDescription}>
                Get notified at 9:00 AM to log your daily progress
              </Text>
            </View>
            <Switch
              value={settings.dailyCheckIn}
              onValueChange={(value) => updateSetting('dailyCheckIn', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.dailyCheckIn ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Achievement Notifications</Text>
              <Text style={styles.settingDescription}>
                Celebrate when you complete commitments
              </Text>
            </View>
            <Switch
              value={settings.achievements}
              onValueChange={(value) => updateSetting('achievements', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.achievements ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Reminder Alerts</Text>
              <Text style={styles.settingDescription}>
                Get alerts for missed check-ins and deadlines
              </Text>
            </View>
            <Switch
              value={settings.reminders}
              onValueChange={(value) => updateSetting('reminders', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={settings.reminders ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={testNotification}
          >
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
          {scheduledNotifications.length > 0 ? (
            scheduledNotifications.map((title, index) => (
              <View key={index} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>{title}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No scheduled notifications</Text>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.cancelAllButton}
            onPress={() => NotificationService.cancelAllNotifications()}
          >
            <Text style={styles.cancelAllButtonText}>
              Cancel All Notifications
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontStyle: 'italic',
  },
  cancelAllButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
