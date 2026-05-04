import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FreeEmailService, useEmailService } from '../lib/freeEmailService';

export default function EmailTestScreen({
  navigation,
}: {
  navigation: { goBack: () => void };
}) {
  const [testEmail, setTestEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const { checkLimit } = useEmailService();

  const sendTestEmail = async () => {
    if (!testEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const result = await FreeEmailService.sendEmailWithLimit({
        to: testEmail,
        subject: '🧪 FounderType Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">🧪 Email Test Successful!</h1>
              <p style="color: #6b7280; font-size: 18px;">FounderType email service is working!</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 15px;">What This Means</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                ✅ Resend API is configured correctly<br/>
                ✅ Email templates are working<br/>
                ✅ Free tier limits are being tracked<br/>
                ✅ Your FounderType app can send emails!
              </p>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #9ca3af; font-size: 14px;">
                This is a test email from FounderType's email service.
              </p>
            </div>
          </div>
        `,
      });

      if (result.success) {
        Alert.alert('Success', 'Test email sent successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to send email');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const sendCompletionEmail = async () => {
    if (!testEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      await FreeEmailService.sendCompletionEmail(testEmail, userName || 'Founder');
      Alert.alert('Success', 'Completion email sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send completion email');
    } finally {
      setLoading(false);
    }
  };

  const sendDailyReminder = async () => {
    if (!testEmail) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      await FreeEmailService.sendDailyReminder(testEmail, userName || 'Founder');
      Alert.alert('Success', 'Daily reminder sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send daily reminder');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailLimit = async () => {
    try {
      const limit = await checkLimit();
      Alert.alert(
        'Email Limit Status',
        `Sent today: ${limit.sentToday}\nRemaining: ${limit.remaining}\nCan send: ${limit.canSend ? 'Yes' : 'No'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check email limit');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Email Test</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Email Service</Text>
          <Text style={styles.description}>
            Test the Resend email integration with different email templates.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Test Email Address:</Text>
            <TextInput
              style={styles.input}
              value={testEmail}
              onChangeText={setTestEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>User Name (optional):</Text>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Different Templates</Text>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={sendTestEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Test Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.completionButton]}
            onPress={sendCompletionEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Completion Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.reminderButton]}
            onPress={sendDailyReminder}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Daily Reminder'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.limitButton]}
            onPress={checkEmailLimit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Email Limit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Service Info</Text>
          <Text style={styles.infoText}>
            • Service: Resend (free tier){'\n'}
            • Limit: 100 emails per day{'n'}
            • Templates: Completion, Daily Reminder, Milestone{'n'}
            • Tracking: Daily limit management{'n'}
            • From: noreply@foundertype.app
          </Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#3B82F6',
  },
  completionButton: {
    backgroundColor: '#22C55E',
  },
  reminderButton: {
    backgroundColor: '#F59E0B',
  },
  limitButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
});