import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getCurrentUserId, recordCheckIn } from '../lib/storage';
import { getProgress } from '../lib/progress';
import { useUserContext } from '../context/UserContext';
import AccountabilityAgentCard from '../components/AccountabilityAgentCard';
import WeeklyReceiptCard from '../components/WeeklyReceiptCard';
import { Commitment } from '../types/commitment';
import {
  AccountabilityReceipt,
  buildWeeklyAccountabilityReceipt,
  getAccountabilityReceipts,
  getLatestAccountabilityReceipt,
  getReceiptEmailAddress,
  getReceiptEmailOptIn,
  isWeeklyReceiptDue,
  saveAccountabilityReceipt,
  saveReceiptEmailAddress,
  saveReceiptEmailOptIn,
  sendAccountabilityReceiptEmail,
} from '../lib/accountabilityReceipts';
import { trackFunnelEvent } from '../lib/funnelAnalytics';

const CHECK_IN_KEY = 'foundertype_daily_checkin';

interface CheckInData {
  currentDay: number;
  completedDays: number[];
  streak: number;
  lastCheckInDate: string | null;
}

export default function DailyCheckInScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { refreshActiveCommitment, activeCommitment: contextCommitment } =
    useUserContext();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [emailCaptchaToken, setEmailCaptchaToken] = useState<string | null>(
    null
  );
  const [checkInData, setCheckInData] = useState<CheckInData>({
    currentDay: 1,
    completedDays: [],
    streak: 0,
    lastCheckInDate: null,
  });
  const [todayAction, setTodayAction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeCommitment, setActiveCommitment] = useState<Commitment | null>(
    null
  );
  const [todayAlreadyCheckedIn, setTodayAlreadyCheckedIn] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [daysSinceStart, setDaysSinceStart] = useState(0);
  const [latestReceipt, setLatestReceipt] =
    useState<AccountabilityReceipt | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<AccountabilityReceipt[]>(
    []
  );
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptEmailOptIn, setReceiptEmailOptIn] = useState(false);
  const [receiptEmailStatus, setReceiptEmailStatus] = useState<string | null>(
    null
  );
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [isSendingReceiptEmail, setIsSendingReceiptEmail] = useState(false);

  useEffect(() => {
    void loadActiveCommitment().finally(() => setLoading(false));
  }, [route?.params?.commitment, contextCommitment]);

  const loadActiveCommitment = async () => {
    // Get commitment from route params
    const routed = route?.params?.commitment;
    const passedCommitment =
      contextCommitment && (!routed || contextCommitment.id === routed.id)
        ? contextCommitment
        : routed;
    if (passedCommitment) {
      setActiveCommitment(passedCommitment as Commitment);
      setCheckInData(getProgress(passedCommitment));
      setTodayAction(passedCommitment.daily_action || '');
      const today = new Date().toISOString().split('T')[0];
      setTodayAlreadyCheckedIn(
        (passedCommitment.check_ins || []).includes(today)
      );

      if (passedCommitment.deadline) {
        const deadline = new Date(passedCommitment.deadline);
        const now = new Date();
        setIsDeadlinePassed(now > deadline);
      }
      if (passedCommitment.created_at) {
        const created = new Date(passedCommitment.created_at);
        const days = Math.floor(
          (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysSinceStart(days);
      }
      const [receipt, receipts, storedEmail, storedEmailOptIn] =
        await Promise.all([
          getLatestAccountabilityReceipt(passedCommitment.id),
          getAccountabilityReceipts(passedCommitment.id),
          getReceiptEmailAddress(),
          getReceiptEmailOptIn(),
        ]);
      setLatestReceipt(receipt);
      setReceiptHistory(receipts);
      setReceiptEmail(storedEmail);
      setReceiptEmailOptIn(storedEmailOptIn);
      return;
    }

    console.error('No commitment passed to DailyCheckIn screen');
  };

  const handleEditCommitment = () => {
    const commitment = activeCommitment || route?.params?.commitment;
    navigation.navigate('commitment', {
      editMode: true,
      commitmentId: commitment?.id,
      initialText: commitment?.commitment_text || '',
      initialDailyAction: todayAction || commitment?.daily_action || '',
      initialDeadline: commitment?.deadline,
    });
  };

  const handleLogWeeklyReceipt = async () => {
    if (!activeCommitment) return;

    setIsSavingReceipt(true);
    try {
      const receipt = buildWeeklyAccountabilityReceipt({
        commitment: activeCommitment,
        todayAlreadyCheckedIn,
        daysSinceStart,
        isDeadlinePassed,
      });
      const saved = await saveAccountabilityReceipt(receipt);
      setLatestReceipt(saved);
      const receipts = await getAccountabilityReceipts(activeCommitment.id);
      setReceiptHistory(receipts);
      setReceiptEmailStatus(
        saved.synced
          ? 'Receipt logged and synced.'
          : 'Receipt saved on this device only. Log it again when connected to sync.'
      );
      trackFunnelEvent(
        'accountability_receipt_logged',
        {
          week_number: saved.weekNumber,
          mode: saved.agentMode,
          synced: Boolean(saved.synced),
        },
        activeCommitment.user_id
      );
    } catch (error) {
      console.error('Error logging weekly accountability receipt:', error);
      const message = 'Failed to log accountability receipt. Please try again.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Receipt Error', message);
      }
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const handleReceiptEmailChange = (email: string) => {
    setReceiptEmail(email);
    setReceiptEmailStatus(null);
    void saveReceiptEmailAddress(email);
  };

  const handleReceiptEmailOptInChange = (enabled: boolean) => {
    setReceiptEmailOptIn(enabled);
    setReceiptEmailStatus(
      enabled
        ? 'Email preference saved. Complete the security check before each send.'
        : 'Automatic weekly receipt emails are off.'
    );
    void saveReceiptEmailOptIn(enabled);
  };

  const handleSendReceiptEmail = async () => {
    if (!latestReceipt) return;

    setIsSendingReceiptEmail(true);
    setReceiptEmailStatus(null);
    try {
      const result = await sendAccountabilityReceiptEmail(
        latestReceipt,
        receiptEmail,
        emailCaptchaToken
      );
      if (result.success) {
        setReceiptEmailStatus('Email provider accepted the receipt.');
        trackFunnelEvent(
          'accountability_receipt_email_sent',
          {
            week_number: latestReceipt.weekNumber,
            mode: latestReceipt.agentMode,
          },
          activeCommitment?.user_id
        );
      } else {
        setReceiptEmailStatus(
          result.error || 'Could not send the receipt email. Please try again.'
        );
        trackFunnelEvent(
          'accountability_receipt_email_failed',
          {
            week_number: latestReceipt.weekNumber,
            mode: latestReceipt.agentMode,
          },
          activeCommitment?.user_id
        );
      }
    } finally {
      setEmailCaptchaToken(null);
      setIsSendingReceiptEmail(false);
    }
  };

  const handleDoneToday = async () => {
    if (!activeCommitment || isCheckingIn || todayAlreadyCheckedIn) return;
    setIsCheckingIn(true);
    try {
      const updated = await recordCheckIn(activeCommitment.id);
      setActiveCommitment(updated);
      setCheckInData(getProgress(updated));
      setTodayAlreadyCheckedIn(true);
      await refreshActiveCommitment();
    } catch {
      const message =
        'Your check-in was not saved. Check your connection and try again.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('Check-in not saved', message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleAbandon = () => {
    const message =
      'This will be marked as ABANDONED and remain visible in the public feed until you delete it.';
    if (Platform.OS === 'web') {
      if (window.confirm(message + ' Are you sure?')) {
        doAbandon();
      }
    } else {
      Alert.alert('Abandon This Commitment?', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "Yes, I'm Abandoning It",
          style: 'destructive',
          onPress: doAbandon,
        },
      ]);
    }
  };

  const doAbandon = async () => {
    // Get commitment from state or route params
    const commitment = activeCommitment || route?.params?.commitment;

    const commitmentId = commitment?.id;
    const commitmentText = commitment?.commitment_text || '';

    if (!commitmentId) {
      console.error('No commitment ID found for abandon');
      if (Platform.OS === 'web') {
        window.alert('Cannot find commitment to abandon');
      } else {
        Alert.alert('Error', 'Cannot find commitment to abandon');
      }
      return;
    }

    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Unable to verify ownership. Please try again.');
      }

      const { error } = await supabase
        .from('commitments')
        .update({ status: 'abandoned' })
        .eq('id', commitmentId)
        .eq('user_id', userId)
        .select('id')
        .single();
      if (error) {
        console.error('Supabase abandon error:', error);
        throw error;
      }

      await AsyncStorage.setItem(
        'foundertype_abandoned_commitment_text',
        commitmentText
      );
      await AsyncStorage.setItem(
        'foundertype_abandoned_date',
        new Date().toISOString()
      );

      // Clear ALL commitment-related storage
      await AsyncStorage.multiRemove([
        'foundertype_has_active_commitment',
        'foundertype_active_commitment_text',
        'foundertype_active_deadline',
        'foundertype_active_commitment',
        'foundertype_commitment',
        CHECK_IN_KEY,
      ]);

      // Show success and redirect to feed
      if (Platform.OS === 'web') {
        window.alert('Commitment marked as ABANDONED');
      } else {
        Alert.alert('Abandoned', 'Commitment marked as ABANDONED');
      }

      await refreshActiveCommitment();
      navigation.navigate('publicFeed');
    } catch (err) {
      console.error('Error abandoning commitment:', err);
      if (Platform.OS === 'web') {
        window.alert('Failed to abandon commitment: ' + (err as Error).message);
      } else {
        Alert.alert(
          'Error',
          'Failed to abandon commitment: ' + (err as Error).message
        );
      }
    }
  };

  const handleMarkComplete = async () => {
    if (!activeCommitment) return;
    try {
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from('commitments')
        .update({ status: 'completed' })
        .eq('id', activeCommitment.id)
        .eq('user_id', userId)
        .select('id')
        .single();
      if (error) throw error;
      await refreshActiveCommitment();

      // Set completion flag
      await AsyncStorage.setItem(
        'foundertype_has_completed_commitment',
        'true'
      );
      await AsyncStorage.removeItem('foundertype_has_active_commitment');
      await AsyncStorage.removeItem('foundertype_active_commitment_text');
      await AsyncStorage.removeItem('foundertype_active_deadline');
      await AsyncStorage.removeItem('foundertype_active_commitment');
      await AsyncStorage.removeItem(CHECK_IN_KEY);

      navigation.navigate('landing');
    } catch (err) {
      console.error('Error marking complete:', err);
      const msg = (err as Error).message || 'Unknown error';
      if (Platform.OS === 'web') {
        window.alert('Failed to sync with public feed: ' + msg);
      } else {
        Alert.alert('Sync Error', 'Failed to sync with public feed: ' + msg);
      }
    }
  };

  const renderDayGrid = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const isCompleted = checkInData.completedDays.includes(i);
      const isCurrent = i === checkInData.currentDay;

      days.push(
        <View
          key={i}
          style={[
            styles.daySquare,
            isCompleted && styles.completedDay,
            isCurrent && styles.currentDay,
          ]}
        >
          <Text
            style={[styles.dayNumber, isCompleted && styles.completedDayText]}
          >
            {i}
          </Text>
        </View>
      );
    }
    return days;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          onPress={() => navigation.navigate('landing')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Day {checkInData.currentDay} of 30</Text>

        {activeCommitment && (
          <View style={styles.commitmentBanner}>
            <Text style={styles.commitmentBannerLabel}>YOUR COMMITMENT</Text>
            <Text style={styles.commitmentBannerText}>
              {activeCommitment.commitment_text}
            </Text>
            {todayAlreadyCheckedIn && (
              <Text style={styles.alreadyCheckedIn}>✓ Checked in today</Text>
            )}
          </View>
        )}

        <AccountabilityAgentCard
          commitment={activeCommitment}
          todayAlreadyCheckedIn={todayAlreadyCheckedIn}
          daysSinceStart={daysSinceStart}
          isDeadlinePassed={isDeadlinePassed}
        />

        <WeeklyReceiptCard
          receipt={latestReceipt}
          receipts={receiptHistory}
          isDue={isWeeklyReceiptDue(latestReceipt)}
          disabled={!activeCommitment || isSavingReceipt}
          email={receiptEmail}
          emailOptIn={receiptEmailOptIn}
          emailStatus={receiptEmailStatus}
          isSendingEmail={isSendingReceiptEmail}
          onLogReceipt={handleLogWeeklyReceipt}
          onEmailChange={handleReceiptEmailChange}
          onEmailOptInChange={handleReceiptEmailOptInChange}
          emailCaptchaToken={emailCaptchaToken}
          onEmailCaptchaVerify={setEmailCaptchaToken}
          onEmailCaptchaReset={() => setEmailCaptchaToken(null)}
          onSendEmail={handleSendReceiptEmail}
        />

        <View style={styles.actionContainer}>
          <Text style={styles.actionLabel}>Today's Action</Text>
          {todayAction ? (
            <View>
              <Text style={styles.actionText}>{todayAction}</Text>
              <TouchableOpacity
                style={styles.editActionButton}
                onPress={handleEditCommitment}
              >
                <Text style={styles.editActionButtonText}>Edit Commitment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.actionText}>
                Add a daily action to start checking in.
              </Text>
              <TouchableOpacity
                style={styles.editActionButton}
                onPress={handleEditCommitment}
              >
                <Text style={styles.editActionButtonText}>
                  Add Daily Action
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Day 30 Decision Section */}
        {(isDeadlinePassed ||
          daysSinceStart >= 30 ||
          checkInData.completedDays.length >= 30) && (
          <View style={styles.decisionCard}>
            <Text style={styles.decisionTitle}>Time's Up</Text>
            <Text style={styles.decisionText}>
              Your 30-day deadline has passed. Mark it complete or abandon it.
            </Text>
            <View style={styles.decisionButtons}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleMarkComplete}
              >
                <Text style={styles.completeButtonText}>Mark Complete ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.abandonBigButton}
                onPress={handleAbandon}
              >
                <Text style={styles.abandonBigText}>Abandon It ✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.decisionNote}>
              Choose an outcome to close this commitment.
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            testID="daily-check-in"
            accessibilityRole="button"
            style={[
              styles.doneButton,
              (todayAlreadyCheckedIn || !todayAction) &&
                styles.doneButtonDisabled,
            ]}
            onPress={handleDoneToday}
            disabled={isCheckingIn || todayAlreadyCheckedIn || !todayAction}
          >
            <Text style={styles.doneButtonText}>
              {todayAlreadyCheckedIn
                ? '✓ Completed Today'
                : !todayAction
                  ? 'No Action Defined'
                  : 'Done Today'}
            </Text>
          </TouchableOpacity>
        </View>

        {checkInData.streak > 1 && (
          <Text style={styles.streakText}>
            {' '}
            {Math.min(checkInData.streak, 30)} day streak
          </Text>
        )}

        <View style={styles.gridContainer}>
          <Text style={styles.gridLabel}>30-Day Progress</Text>
          <View style={styles.dayGrid}>{renderDayGrid()}</View>
        </View>

        {/* Abandon link */}
        <TouchableOpacity style={styles.abandonLink} onPress={handleAbandon}>
          <Text style={styles.abandonText}>I'm abandoning this commitment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: {
    padding: 20,
    paddingTop: 10,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' },
  loadingText: { color: '#FFFFFF', textAlign: 'center', marginTop: 100 },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 20,
  },
  commitmentBanner: {
    backgroundColor: '#0D1F3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  commitmentBannerLabel: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  commitmentBannerText: { color: '#CCCCCC', fontSize: 14, lineHeight: 20 },
  alreadyCheckedIn: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  actionContainer: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  actionLabel: { fontSize: 16, color: '#888888', marginBottom: 10 },
  actionText: { fontSize: 20, color: '#FFFFFF', lineHeight: 28 },
  buttonContainer: { marginBottom: 30 },
  doneButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonDisabled: { backgroundColor: '#1E3A5F' },
  doneButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  streakText: {
    fontSize: 18,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
  },
  gridContainer: { marginTop: 20 },
  gridLabel: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 15,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  daySquare: {
    width: 40,
    height: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedDay: { backgroundColor: '#3B82F6' },
  currentDay: { borderWidth: 2, borderColor: '#FF6B35' },
  dayNumber: { fontSize: 12, color: '#888888', fontWeight: 'bold' },
  completedDayText: { color: '#FFFFFF' },
  abandonLink: { alignItems: 'center', paddingTop: 32, paddingBottom: 8 },
  abandonText: {
    color: '#444444',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  decisionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  decisionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  decisionText: {
    color: '#CCCCCC',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  decisionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  abandonBigButton: {
    backgroundColor: '#1A0A0A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  abandonBigText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  decisionNote: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
  },
  editActionButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  editActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
