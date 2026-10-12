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
import { getCurrentUserId } from '../lib/storage';
import HCaptchaWrapper from '../components/HCaptchaWrapper';
import { EnhancedButton } from '../components/EnhancedButton';
import { MobilePolish } from '../lib/mobilePolish';
import { trackFunnelEvent } from '../lib/funnelAnalytics';

const MAX_CHARS = 140;
const MAX_DAILY_ACTION_CHARS = 60;

const EXAMPLE_TEMPLATES = [
  'I will get my first paying customer by [date]',
  'I will launch a working prototype by [date]',
  'I will have 10 conversations with real potential customers by [date]',
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
  'Content can be corrected for 24 hours; owners can delete it',
];

interface CommitmentRouteParams {
  profile?: string | { founderType?: string };
  editMode?: boolean;
  commitmentId?: string;
  initialText?: string;
  initialDailyAction?: string;
  initialDeadline?: string;
}

export default function CommitmentScreen({
  navigation,
  route,
}: {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
  route: { params?: CommitmentRouteParams };
}) {
  const { activeCommitment, currentSlotStatus, user, refreshActiveCommitment } =
    useUserContext();

  const [commitment, setCommitment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyAction, setDailyAction] = useState('');
  const [agreedPublic, setAgreedPublic] = useState(false);
  const [agreedPermanent, setAgreedPermanent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const profile = route?.params?.profile;
  const examples = EXAMPLE_TEMPLATES.map(replaceDatePlaceholders);

  // Edit mode support
  const editMode = route?.params?.editMode || false;
  const commitmentId = route?.params?.commitmentId;
  const initialText = route?.params?.initialText;
  const initialDailyAction = route?.params?.initialDailyAction;

  useEffect(() => {
    if (editMode && initialText) {
      setCommitment(initialText);
      setDailyAction(initialDailyAction || '');
      setAgreedPublic(true);
      setAgreedPermanent(true);
    }
  }, [editMode, initialText, initialDailyAction]);

  useEffect(() => {
    trackFunnelEvent('commitment_screen_reached', {
      edit_mode: editMode,
    });
  }, [editMode]);

  const showValidationError = (message: string, title = 'Required') => {
    setFormError(message);
    if (Platform.OS !== 'web') {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!commitment.trim()) {
      showValidationError('Write the public commitment you want on record.');
      return;
    }

    if (commitment.trim().length > MAX_CHARS) {
      showValidationError(
        `Commitment must be ${MAX_CHARS} characters or less.`,
        'Too Long'
      );
      return;
    }

    if (!dailyAction.trim()) {
      showValidationError(
        'Write the daily action you will repeat to make the commitment real.'
      );
      return;
    }

    if (dailyAction.trim().length > MAX_DAILY_ACTION_CHARS) {
      showValidationError(
        `Daily action must be ${MAX_DAILY_ACTION_CHARS} characters or less.`,
        'Too Long'
      );
      return;
    }

    if (!agreedPublic) {
      showValidationError(
        'Confirm that this commitment will be public and visible in the FounderType record.'
      );
      return;
    }

    if (!agreedPermanent) {
      showValidationError(
        'Acknowledge that this commitment locks for editing after 24 hours.'
      );
      return;
    }

    if (!editMode && !captchaToken) {
      showValidationError('Complete the security check before posting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = user?.id || (await getCurrentUserId(captchaToken));
      if (!userId || userId.startsWith('local-')) {
        throw new Error('Unable to create a secure session. Please try again.');
      }

      // Replace [date] placeholders with actual dates
      const processedCommitment = replaceDatePlaceholders(commitment);

      // Edit mode - update existing commitment
      if (editMode) {
        if (!commitmentId || String(commitmentId).startsWith('local-')) {
          throw new Error('A saved commitment is required for editing.');
        }
        const { data: updatedCommitment, error } = await supabase
          .from('commitments')
          .update({
            commitment_text: processedCommitment.trim(),
            daily_action: dailyAction.trim(),
          })
          .eq('id', commitmentId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error || !updatedCommitment) {
          console.error('Error updating commitment:', error);
          showValidationError(
            'Failed to update commitment. Please try again.',
            'Error'
          );
          return;
        }

        await refreshActiveCommitment();
        trackFunnelEvent(
          'commitment_posted',
          {
            edit_mode: true,
            synced: !commitmentId?.startsWith('local-'),
          },
          userId
        );
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
        } catch {
          /* ignore */
        }
      }

      const newCommitment = {
        user_id: userId,
        commitment_text: processedCommitment.trim(),
        daily_action: dailyAction.trim(),
        founder_type: founderType || 'Founder',
      };

      const { data: savedCommitment, error: saveError } = await supabase
        .from('commitments')
        .insert(newCommitment)
        .select()
        .single();
      if (saveError || !savedCommitment) {
        throw new Error(
          'Your commitment was not posted. Check your connection and active commitment, then retry.'
        );
      }

      await refreshActiveCommitment();
      trackFunnelEvent(
        'commitment_posted',
        {
          edit_mode: false,
          synced: Boolean(savedCommitment),
        },
        userId
      );
      navigation.navigate('dailyCheckIn', {
        commitment: savedCommitment,
      });
    } catch (err) {
      console.error('Error posting commitment:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      if (Platform.OS === 'web') {
        setFormError(message);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setCaptchaToken(null);
      setIsSubmitting(false);
    }
  };

  const handleExampleTap = (example: string) => {
    setCommitment(example);
    // Trigger light haptic for example selection
    if (Platform.OS !== 'web') {
      MobilePolish.triggerTouchFeedback();
    }
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

  const SafeContainer = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <SafeContainer style={styles.container}>
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

        {formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        )}

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

        {(editMode || currentSlotStatus !== 'active') && (
          <View style={styles.mainContent}>
            <View style={styles.commitmentGuidance}>
              <Text style={styles.guidanceKicker}>PUBLIC RECORD</Text>
              <Text style={styles.guidanceTitle}>
                One thing a stranger could verify in 30 days.
              </Text>
              <Text style={styles.guidanceText}>
                Do not write a wish, identity, or vague goal. Write the outcome
                you are willing to have visible if you follow through or quit.
              </Text>
            </View>

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
                  onChangeText={(value) => {
                    setCommitment(value);
                    if (formError) setFormError(null);
                  }}
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
                  testID="daily-action"
                  placeholderTextColor="#93C5FD"
                  value={dailyAction}
                  onChangeText={(value) => {
                    setDailyAction(value);
                    if (formError) setFormError(null);
                  }}
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
              {examples.map((example, i) => (
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
              <Text style={styles.warningTitle}>24-Hour Edit Window</Text>
              <Text style={styles.warningText}>
                Once 24 hours pass, this commitment locks for editing.
              </Text>
              <Text style={styles.warningText}>
                You can edit the text and daily action in the first 24 hours.
              </Text>
              <Text style={styles.warningText}>
                Your deadline is {formattedDate}. You can still mark the
                outcome.
              </Text>
              <Text style={styles.warningText}>
                Owners can delete their records. Public records are not
                guaranteed permanent.
              </Text>
            </View>

            <View style={styles.quitSection}>
              <Text style={styles.quitTitle}>What happens if I quit?</Text>
              <Text style={styles.quitText}>
                Nothing dramatic. No shame spiral. FounderType simply marks the
                commitment as abandoned so the pattern cannot hide as another
                private reset.
              </Text>
              <Text style={styles.quitText}>
                That record is the point: follow through, recommit honestly, or
                see the loop clearly enough to stop pretending it was random.
              </Text>
            </View>

            <TouchableOpacity
              testID="agree-public"
              style={styles.checkboxRow}
              onPress={() => {
                setAgreedPublic(!agreedPublic);
                // Trigger haptic for checkbox interaction
                if (Platform.OS !== 'web') {
                  MobilePolish.triggerTouchFeedback();
                }
              }}
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
                FounderType users
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="agree-edit-window"
              style={styles.checkboxRow}
              onPress={() => {
                setAgreedPermanent(!agreedPermanent);
                // Trigger haptic for checkbox interaction
                if (Platform.OS !== 'web') {
                  MobilePolish.triggerTouchFeedback();
                }
              }}
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
                I understand this commitment locks for editing after 24 hours
              </Text>
            </TouchableOpacity>

            <HCaptchaWrapper
              onVerify={(token) => {
                setCaptchaToken(token);
                trackFunnelEvent('captcha_complete');
              }}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />

            {formError && (
              <View style={styles.ctaErrorBanner}>
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            <View style={styles.ctaSection}>
              <EnhancedButton
                title={isSubmitting ? 'Posting...' : 'Post My Commitment'}
                onPress={handleSubmit}
                variant="primary"
                size="large"
                disabled={isSubmitting}
                loading={isSubmitting}
                haptic={true}
              />
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
    </SafeContainer>
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
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
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
  commitmentGuidance: {
    backgroundColor: '#101827',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  guidanceKicker: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  guidanceTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  guidanceText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 21,
  },
  errorBanner: {
    backgroundColor: '#1A0A0A',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  ctaErrorBanner: {
    backgroundColor: '#1A0A0A',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
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
  quitSection: {
    backgroundColor: '#101010',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  quitTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  quitText: {
    color: '#BDBDBD',
    fontSize: 14,
    lineHeight: 21,
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
