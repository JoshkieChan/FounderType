import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useUserContext } from '../context/UserContext';
import HCaptchaWrapper from '../components/HCaptchaWrapper';

const MAX_CHARS = 140;
const MAX_DAILY_ACTION_CHARS = 60;

const EXAMPLES = [
  'I will get my first paying customer by May 30, 2026',
  'I will launch a working prototype by May 30, 2026',
  'I will have 10 conversations with real potential customers by May 30, 2026',
];

function get30DaysFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

function replaceDatePlaceholders(text: string): string {
  const deadline = get30DaysFromNow();
  const formattedDate = deadline.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return text.replace(/\[date\]/g, formattedDate);
}

const RULES = [
  'Must be specific and verifiable by a stranger',
  'Must have completion date within 30 days',
  "Once posted, it's public and can't be edited",
];

export default function CommitmentScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { activeCommitment, currentSlotStatus, user, refreshActiveCommitment } =
    useUserContext();

  const [commitment, setCommitment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyAction, setDailyAction] = useState('');
  const [agreedPublic, setAgreedPublic] = useState(false);
  const [agreedPermanent, setAgreedPermanent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const profile = route?.params?.profile;
  const answers = route?.params?.answers;

  // Edit mode support
  const editMode = route?.params?.editMode || false;
  const commitmentId = route?.params?.commitmentId;
  const initialText = route?.params?.initialText;
  const initialDailyAction = route?.params?.initialDailyAction;
  const initialDeadline = route?.params?.initialDeadline;

  useEffect(() => {
    if (editMode && initialText) {
      setCommitment(initialText);
      setDailyAction(initialDailyAction || '');
      setAgreedPublic(true);
      setAgreedPermanent(true);
    }
  }, [editMode, initialText, initialDailyAction]);

  const handleSubmit = async () => {
    if (!commitment.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a commitment.');
      } else {
        Alert.alert('Required', 'Please enter a commitment.');
      }
      return;
    }

    if (commitment.trim().length > MAX_CHARS) {
      if (Platform.OS === 'web') {
        window.alert(`Commitment must be ${MAX_CHARS} characters or less.`);
      } else {
        Alert.alert(
          'Too Long',
          `Commitment must be ${MAX_CHARS} characters or less.`
        );
      }
      return;
    }

    if (!dailyAction.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your daily action.');
      } else {
        Alert.alert(
          'Required',
          'Please enter what you will do every day to achieve this commitment.'
        );
      }
      return;
    }

    if (dailyAction.trim().length > MAX_DAILY_ACTION_CHARS) {
      if (Platform.OS === 'web') {
        window.alert(
          `Daily action must be ${MAX_DAILY_ACTION_CHARS} characters or less.`
        );
      } else {
        Alert.alert(
          'Too Long',
          `Daily action must be ${MAX_DAILY_ACTION_CHARS} characters or less.`
        );
      }
      return;
    }

    if (!agreedPublic) {
      if (Platform.OS === 'web') {
        window.alert('You must agree that this commitment will be public.');
      } else {
        Alert.alert(
          'Required',
          'You must agree that this commitment will be public and visible to all users.'
        );
      }
      return;
    }

    if (!agreedPermanent) {
      if (Platform.OS === 'web') {
        window.alert(
          'You must acknowledge that this commitment becomes permanent after 24 hours.'
        );
      } else {
        Alert.alert(
          'Required',
          'You must acknowledge that this commitment becomes permanent after 24 hours.'
        );
      }
      return;
    }

    if (Platform.OS === 'web' && !editMode && !captchaToken) {
      window.alert('Please complete the security check (captcha).');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Replace [date] placeholders with actual dates
      const processedCommitment = replaceDatePlaceholders(commitment);

      // Edit mode - update existing commitment
      if (editMode) {
        const updatedCommitment = {
          id: commitmentId,
          commitment_text: processedCommitment.trim(),
          daily_action: dailyAction.trim(),
          deadline: initialDeadline,
          status: 'active',
          check_ins: [],
        };

        if (commitmentId && !String(commitmentId).startsWith('local-')) {
          const { error } = await supabase
            .from('commitments')
            .update({
              commitment_text: processedCommitment.trim(),
              daily_action: dailyAction.trim(),
            })
            .eq('id', commitmentId);

          if (error) {
            console.error('Error updating commitment:', error);
            if (Platform.OS === 'web') {
              window.alert('Failed to update commitment. Please try again.');
            } else {
              Alert.alert(
                'Error',
                'Failed to update commitment. Please try again.'
              );
            }
            return;
          }
        }

        await refreshActiveCommitment();
        navigation.navigate('dailyCheckIn', { commitment: updatedCommitment });
        return;
      }

      // Fresh or returning after completion: post one public 30-day commitment.
      let founderType = null;
      if (profile) {
        try {
          const parsed =
            typeof profile === 'string' ? JSON.parse(profile) : profile;
          founderType = parsed?.founderType || null;
        } catch (e) {
          /* ignore */
        }
      }

      const deadline = get30DaysFromNow().toISOString();
      const fallbackCommitment = {
        id: `local-${Date.now()}`,
        user_id: user?.id || null,
        commitment_text: processedCommitment.trim(),
        daily_action: dailyAction.trim(),
        founder_type: founderType || 'Founder',
        status: 'active',
        deadline,
        created_at: new Date().toISOString(),
        check_ins: [],
      };

      // Save to Supabase (all commitments are public by default)
      let savedCommitment;
      try {
        const { data, error } = await supabase
          .from('commitments')
          .insert({ ...fallbackCommitment, id: undefined }) // Let Supabase generate UUID
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error saving commitment to Supabase:', error);
        } else {
          savedCommitment = data;
        }
      } catch (e) {
        console.error('Failed to sync with Supabase:', e);
      }

      await refreshActiveCommitment();
      navigation.navigate('dailyCheckIn', {
        commitment: savedCommitment || fallbackCommitment,
      });
    } catch (err) {
      console.error('Error posting commitment:', err);
      if (Platform.OS === 'web') {
        window.alert('Something went wrong. Please try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleExampleTap = (example: string) => {
    setCommitment(example);
  };

  const handleViewProgress = () => {
    if (activeCommitment) {
      navigation.navigate('dailyCheckIn', { commitment: activeCommitment });
    } else {
      Alert.alert('Error', 'No active commitment found');
    }
  };

  const targetDate = get30DaysFromNow();
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.backText}>×</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {editMode ? 'Edit Your Commitment' : 'Post Your Commitment'}
          </Text>
          <Text style={styles.subtitle}>
            {editMode
              ? 'Update your commitment text.'
              : 'Make it public. Make it happen.'}
          </Text>
        </View>

        {/* GATE BANNERS */}
        {currentSlotStatus === 'active' && activeCommitment && (
          <View
            style={[
              styles.gateBanner,
              { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
            ]}
          >
            <Text style={[styles.gateLabel, { color: '#92400E' }]}>
              ACTIVE COMMITMENT
            </Text>
            <Text style={styles.gateText}>
              "{activeCommitment.commitment_text}"
            </Text>
            <Text style={[styles.gateMeta, { color: '#B45309' }]}>
              {Math.ceil(
                (new Date(activeCommitment.deadline).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days remaining
            </Text>
            <TouchableOpacity
              style={[styles.gateCta, { backgroundColor: '#F59E0B' }]}
              onPress={handleViewProgress}
            >
              <Text style={styles.gateCtaText}>View Progress →</Text>
            </TouchableOpacity>
          </View>
        )}

        {!editMode && currentSlotStatus !== 'active' && (
          <View style={styles.mainContent}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Your 30-Day Commitment</Text>
              <Text style={styles.charCount}>
                {commitment.length}/{MAX_CHARS}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="I will..."
                  placeholderTextColor="#666666"
                  value={commitment}
                  onChangeText={setCommitment}
                  multiline
                  maxLength={MAX_CHARS}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>
                What will you do EVERY DAY to achieve this?
              </Text>
              <Text style={styles.charCount}>
                {dailyAction.length}/{MAX_DAILY_ACTION_CHARS}
              </Text>
              <View style={[styles.inputContainer, { borderColor: '#3B82F6' }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 'Send 3 cold emails' or 'Code for 2 hours'"
                  placeholderTextColor="#93C5FD"
                  value={dailyAction}
                  onChangeText={setDailyAction}
                  maxLength={MAX_DAILY_ACTION_CHARS}
                  editable={!isSubmitting}
                />
              </View>
              <Text style={styles.helpText}>
                Be specific and realistic. You'll check this off EVERY DAY for
                30 days.
              </Text>
            </View>

            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Examples</Text>
              {EXAMPLES.map((example, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.example}
                  onPress={() => handleExampleTap(example)}
                >
                  <Text style={styles.exampleText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rulesSection}>
              <Text style={styles.rulesTitle}>Rules</Text>
              {RULES.map((rule, i) => (
                <Text key={i} style={styles.ruleText}>
                  • {rule}
                </Text>
              ))}
            </View>

            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>
                ⚠️ Important: 24-Hour Edit Window
              </Text>
              <Text style={styles.warningText}>
                Once 24 hours pass, this commitment becomes permanent.
              </Text>
              <Text style={styles.warningText}>
                You can edit or delete it in the first 24 hours to fix mistakes.
              </Text>
              <Text style={styles.warningText}>
                After that, it's locked until your deadline on {formattedDate}.
              </Text>
              <Text style={styles.warningText}>
                If you don't complete it by then, it will be marked as ABANDONED
                and stay in the public feed forever.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedPublic(!agreedPublic)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedPublic && styles.checkboxChecked,
                ]}
              >
                {agreedPublic && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand this commitment will be public and visible to all
                users
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreedPermanent(!agreedPermanent)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedPermanent && styles.checkboxChecked,
                ]}
              >
                {agreedPermanent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand this commitment becomes permanent after 24 hours
              </Text>
            </TouchableOpacity>

            <HCaptchaWrapper
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />

            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Posting...' : 'Post My Commitment'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.freeLabel}>
                One active public commitment at a time.
              </Text>
            </View>
          </View>
        )}

        {/* EDIT MODE UI */}
        {editMode && (
          <View style={styles.mainContent}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Your 30-Day Commitment</Text>
              <Text style={styles.charCount}>
                {commitment.length}/{MAX_CHARS}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="I will..."
                  placeholderTextColor="#666666"
                  value={commitment}
                  onChangeText={setCommitment}
                  multiline
                  maxLength={MAX_CHARS}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>
                What will you do EVERY DAY to achieve this?
              </Text>
              <Text style={styles.charCount}>
                {dailyAction.length}/{MAX_DAILY_ACTION_CHARS}
              </Text>
              <View style={[styles.inputContainer, { borderColor: '#3B82F6' }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 'Send 3 cold emails' or 'Code for 2 hours'"
                  placeholderTextColor="#93C5FD"
                  value={dailyAction}
                  onChangeText={setDailyAction}
                  maxLength={MAX_DAILY_ACTION_CHARS}
                  editable={!isSubmitting}
                />
              </View>
              <Text style={styles.helpText}>
                This is what appears on your daily progress screen.
              </Text>
            </View>

            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.freeLabel}>
                Changes will be reflected in the feed immediately.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backText: {
    color: '#3B82F6',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  mainContent: {
    flex: 1,
  },
  gateBanner: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  gateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  gateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  gateMeta: {
    fontSize: 14,
    marginBottom: 12,
  },
  gateCta: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  gateCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  examplesSection: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  example: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  rulesSection: {
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  ruleText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  warningSection: {
    backgroundColor: '#1A0A0A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  warningTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  warningText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    flex: 1,
  },
  ctaSection: {
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  freeLabel: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
  },
  helpText: {
    color: '#93C5FD',
    fontSize: 14,
    marginTop: 8,
  },
});
