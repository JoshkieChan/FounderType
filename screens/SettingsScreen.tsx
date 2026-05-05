import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { pushNotifications } from '../lib/pushNotifications';
import { useNetInfo } from '@react-native-community/netinfo';

interface SettingsItem {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'action' | 'navigation';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

const Container = Platform.OS === 'web' ? View : SafeAreaView;

export default function SettingsScreen({ navigation }: { navigation?: any }) {
  const { theme, isDark, colors, setTheme, toggleTheme } = useTheme();
  const netInfo = useNetInfo();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [supportAlerts, setSupportAlerts] = useState(true);

  const handleNotificationToggle = async (key: string, value: boolean) => {
    try {
      await pushNotifications.saveSettings({ [key]: value });

      switch (key) {
        case 'enabled':
          setNotificationsEnabled(value);
          break;
        case 'dailyReminder':
          setDailyReminder(value);
          break;
        case 'achievements':
          setAchievements(value);
          break;
        case 'supportAlerts':
          setSupportAlerts(value);
          break;
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'sunny-outline';
      case 'dark':
        return 'moon-outline';
      case 'system':
        return 'phone-portrait-outline';
      default:
        return 'phone-portrait-outline';
    }
  };

  const settingsSections: SettingsItem[][] = [
    // Theme Settings
    [
      {
        title: 'Appearance',
        subtitle: `${getThemeLabel()} mode`,
        icon: getThemeIcon(),
        type: 'navigation',
        onPress: () => {
          // Cycle through themes
          if (theme === 'light') {
            setTheme('dark');
          } else if (theme === 'dark') {
            setTheme('system');
          } else {
            setTheme('light');
          }
        },
      },
    ],
    // Notification Settings
    [
      {
        title: 'Enable Notifications',
        subtitle: 'Receive push notifications',
        icon: 'notifications-outline',
        type: 'toggle',
        value: notificationsEnabled,
        onToggle: (value) => handleNotificationToggle('enabled', value),
      },
      {
        title: 'Daily Reminders',
        subtitle: 'Check-in reminders at 9:00 AM',
        icon: 'alarm-outline',
        type: 'toggle',
        value: dailyReminder,
        onToggle: (value) => handleNotificationToggle('dailyReminder', value),
      },
      {
        title: 'Achievement Notifications',
        subtitle: 'Celebrate your milestones',
        icon: 'trophy-outline',
        type: 'toggle',
        value: achievements,
        onToggle: (value) => handleNotificationToggle('achievements', value),
      },
      {
        title: 'Support Alerts',
        subtitle: 'When others support your commitments',
        icon: 'heart-outline',
        type: 'toggle',
        value: supportAlerts,
        onToggle: (value) => handleNotificationToggle('supportAlerts', value),
      },
    ],
    // App Settings
    [
      {
        title: 'Privacy Policy',
        subtitle: 'View our privacy policy',
        icon: 'lock-closed-outline',
        type: 'navigation',
        onPress: () => {
          navigation?.navigate?.('privacyPolicy');
        },
      },
      {
        title: 'Terms of Service',
        subtitle: 'View our terms of service',
        icon: 'document-text-outline',
        type: 'navigation',
        onPress: () => {
          navigation?.navigate?.('terms');
        },
      },
      {
        title: 'Contact Support',
        subtitle: 'Get help with FounderType',
        icon: 'mail-outline',
        type: 'navigation',
        onPress: () => {
          Linking.openURL('mailto:support@foundertype.app');
        },
      },
    ],
    // About
    [
      {
        title: 'About',
        subtitle: 'FounderType v1.0.0',
        icon: 'information-circle-outline',
        type: 'navigation',
        onPress: () => {
          Alert.alert(
            'About FounderType',
            'Public accountability for founders who finish what they start.\n\nVersion 1.0.0\n\nBuilt with ❤️ for the founder community.',
            [{ text: 'OK', style: 'default' }]
          );
        },
      },
    ],
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    return (
      <TouchableOpacity
        key={item.title}
        style={[styles.settingsItem, { backgroundColor: colors.card }]}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.itemLeft}>
          <View
            style={[styles.iconContainer, { backgroundColor: colors.surface }]}
          >
            <Ionicons name={item.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text
                style={[styles.itemSubtitle, { color: colors.textSecondary }]}
              >
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.itemRight}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
              ios_backgroundColor={colors.border}
            />
          )}
          {item.type === 'navigation' && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (items: SettingsItem[], title?: string) => (
    <View key={title} style={styles.section}>
      {title && (
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {title}
        </Text>
      )}
      <View
        style={[styles.sectionContainer, { backgroundColor: colors.surface }]}
      >
        {items.map(renderSettingsItem)}
      </View>
    </View>
  );

  return (
    <Container
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.connectionStatus}>
          <Ionicons
            name={netInfo.isConnected ? 'wifi' : 'cloud-offline-outline'}
            size={16}
            color={netInfo.isConnected ? colors.success : colors.error}
          />
          <Text
            style={[styles.connectionText, { color: colors.textSecondary }]}
          >
            {netInfo.isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderSection(settingsSections[0], 'Appearance')}
        {renderSection(settingsSections[1], 'Notifications')}
        {renderSection(settingsSections[2], 'App Settings')}
        {renderSection(settingsSections[3], 'About')}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            FounderType helps founders build consistency through public
            accountability.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  itemRight: {
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
