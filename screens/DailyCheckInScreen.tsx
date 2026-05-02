import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getCurrentUserId } from '../lib/storage';

const CHECK_IN_KEY = 'foundertype_daily_checkin';

interface CheckInData {
  currentDay: number;
  completedDays: number[];
  streak: number;
  lastCheckInDate: string | null;
}

export default function DailyCheckInScreen({ navigation, route }: { navigation: any; route: any }) {
  const [checkInData, setCheckInData] = useState<CheckInData>({
    currentDay: 1,
    completedDays: [],
    streak: 0,
    lastCheckInDate: null,
  });
  const [todayAction, setTodayAction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeCommitment, setActiveCommitment] = useState<any>(null);
  const [todayAlreadyCheckedIn, setTodayAlreadyCheckedIn] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  useEffect(() => {
    loadCheckInData();
    loadTodayAction();
    loadActiveCommitment();
  }, []);

  const loadActiveCommitment = async () => {
    // Get commitment from route params
    const passedCommitment = route?.params?.commitment;
    if (passedCommitment) {
      console.log('Received commitment in screen:', passedCommitment);
      setActiveCommitment(passedCommitment);
      setTodayAction(passedCommitment.daily_action || '');
      const today = new Date().toISOString().split('T')[0];
      setTodayAlreadyCheckedIn((passedCommitment.check_ins || []).includes(today));

      if (passedCommitment.deadline) {
        const deadline = new Date(passedCommitment.deadline);
        const now = new Date();
        setIsDeadlinePassed(now > deadline);
      }
      if (passedCommitment.created_at) {
        const created = new Date(passedCommitment.created_at);
        const days = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        setDaysSinceStart(days);
      }
      return;
    }
    
    console.error('No commitment passed to DailyCheckIn screen');
  };

  const loadCheckInData = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHECK_IN_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        const lastDate = data.lastCheckInDate;

        if (lastDate && lastDate !== today) {
          const lastCheckIn = new Date(lastDate);
          const daysDiff = Math.floor((new Date().getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 1) {
            data.streak = 0;
          }
        }

        setCheckInData(data);
      }
    } catch (error) {
      console.error('Error loading check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAction = async () => {
    try {
      // Load daily_action from active commitment
      const storedCommitment = await AsyncStorage.getItem('foundertype_active_commitment');
      if (storedCommitment) {
        const commitment = JSON.parse(storedCommitment);
        if (commitment.daily_action) {
          setTodayAction(commitment.daily_action);
        }
      }
    } catch (error) {
      console.error('Error loading today action:', error);
    }
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

  const saveCheckInData = async (newData: CheckInData) => {
    try {
      await AsyncStorage.setItem(CHECK_IN_KEY, JSON.stringify(newData));
      setCheckInData(newData);
    } catch (error) {
      console.error('Error saving check-in data:', error);
    }
  };

  const handleDoneToday = async () => {
    const today = new Date().toDateString();
    const newCompletedDays = [...checkInData.completedDays, checkInData.currentDay];
    const newStreak = checkInData.streak + 1;
    const nextDay = checkInData.currentDay + 1;

    const newData: CheckInData = {
      currentDay: nextDay > 30 ? 30 : nextDay,
      completedDays: newCompletedDays,
      streak: newStreak,
      lastCheckInDate: today,
    };

    await saveCheckInData(newData);

    // Update Supabase commitment check-ins
    if (activeCommitment && !String(activeCommitment.id).startsWith('local-')) {
      try {
        const completedAt = new Date().toISOString();
        const todayIso = completedAt.split('T')[0];
        const updatedCheckIns = [...(activeCommitment.check_ins || []), todayIso];

        await supabase.from('commitments').update({
          check_ins: updatedCheckIns,
          days_completed: newCompletedDays.length,
        }).eq('id', activeCommitment.id);

          await supabase.from('daily_progress').upsert({
            commitment_id: activeCommitment.id,
            day_number: checkInData.currentDay,
            completed: true,
            completed_at: completedAt,
          }, { onConflict: 'commitment_id,day_number' });

          setActiveCommitment({
            ...activeCommitment,
            check_ins: updatedCheckIns,
            days_completed: newCompletedDays.length,
          });
          setTodayAlreadyCheckedIn(true);
        } catch (err) {
          console.error('Error updating commitment check-in:', err);
        }
      }

    // Simple milestone detection
    if (newCompletedDays.length === 1) {
      // Day 1 milestone
    } else if (newCompletedDays.length === 7) {
      // Week 1 milestone
    }

    if (nextDay > 30) {
      // Day 30 reached — show completion prompt instead of auto-completing
      if (Platform.OS === 'web') {
        window.alert('Day 30 reached. Time to mark your commitment complete or abandon it.');
      } else {
        Alert.alert('Day 30', 'Time to mark your commitment complete or abandon it.');
      }
      return;
    } else {
      if (Platform.OS === 'web') {
        window.alert('Day ' + checkInData.currentDay + ' done. Come back tomorrow.');
      } else {
        Alert.alert('Great job!', 'Come back tomorrow for your next action!');
      }
    }
  };

  
  const handleDeleteBroken = async () => {
    console.log('Delete button pressed');
    
    // Get commitment from state or route params
    const commitment = activeCommitment || route?.params?.commitment;
    console.log('Using commitment:', commitment);
    
    const commitmentId = commitment?.id;
    
    if (!commitmentId) {
      console.error('No commitment ID found');
      if (Platform.OS === 'web') {
        window.alert('Cannot find commitment to delete');
      } else {
        Alert.alert('Error', 'Cannot find commitment to delete');
      }
      return;
    }
    
    console.log('Deleting commitment with ID:', commitmentId);
    
    try {
      const userId = await getCurrentUserId();
      console.log('User ID:', userId);
      
      // Hard delete commitment
      const { error } = await supabase
        .from('commitments')
        .delete()
        .eq('id', commitmentId);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Commitment deleted from database');

      // Clear ALL commitment-related storage
      await AsyncStorage.multiRemove([
        'foundertype_has_active_commitment',
        'foundertype_active_commitment_text',
        'foundertype_active_deadline',
        'foundertype_active_commitment',
        'foundertype_commitment',
      ]);
      
      console.log('Storage cleared, navigating to landing');

      // Show success and redirect to home
      if (Platform.OS === 'web') {
        window.alert('Commitment deleted successfully');
      } else {
        Alert.alert('Success', 'Commitment deleted successfully');
      }
      
      navigation.navigate('landing');
    } catch (err) {
      console.error('Error deleting commitment:', err);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete commitment: ' + (err as Error).message);
      } else {
        Alert.alert('Error', 'Failed to delete commitment: ' + (err as Error).message);
      }
    }
  };

  const handleAbandon = () => {
    const message = "This will be marked as ABANDONED and stay visible in the public feed forever. Everyone will see you gave up.";
    if (Platform.OS === 'web') {
      if (window.confirm(message + ' Are you sure?')) {
        doAbandon();
      }
    } else {
      Alert.alert(
        'Abandon This Commitment?',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: "Yes, I'm Abandoning It", style: 'destructive', onPress: doAbandon },
        ]
      );
    }
  };

  const doAbandon = async () => {
    console.log('Abandon confirmed, starting process...');
    
    // Get commitment from state or route params
    const commitment = activeCommitment || route?.params?.commitment;
    console.log('Using commitment for abandon:', commitment);
    
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
    
    console.log('Abandoning commitment with ID:', commitmentId);
    
    try {
      const userId = await getCurrentUserId();
      console.log('User ID:', userId);
      
      const isLocal = String(commitmentId).startsWith('local-');
      const abandonedAt = new Date().toISOString();
      const abandonedOnDay = daysSinceStart + 1;
      
      let error;
      if (isLocal) {
        const { error: insertError } = await supabase
          .from('commitments')
          .insert({
            commitment_text: commitmentText,
            founder_type: activeCommitment?.founder_type || 'Founder',
            status: 'abandoned',
            abandoned: true,
            abandoned_at: abandonedAt,
            abandoned_on_day: abandonedOnDay,
            deadline: activeCommitment?.deadline || new Date().toISOString(),
            created_at: activeCommitment?.created_at || new Date().toISOString(),
          });
        error = insertError;
      } else {
        const { error: updateError } = await supabase
          .from('commitments')
          .update({ 
            status: 'abandoned', 
            abandoned: true,
            abandoned_at: abandonedAt,
            abandoned_on_day: abandonedOnDay
          })
          .eq('id', commitmentId);
        error = updateError;
      }
      
      if (error) {
        console.error('Supabase abandon error:', error);
        throw error;
      }
      
      console.log('Commitment marked as abandoned in database');

      await AsyncStorage.setItem('foundertype_abandoned_commitment_text', commitmentText);
      await AsyncStorage.setItem('foundertype_abandoned_date', new Date().toISOString());

      // Clear ALL commitment-related storage
      await AsyncStorage.multiRemove([
        'foundertype_has_active_commitment',
        'foundertype_active_commitment_text',
        'foundertype_active_deadline',
        'foundertype_active_commitment',
        'foundertype_commitment',
        CHECK_IN_KEY,
      ]);

      console.log('Abandon complete, navigating to feed');

      // Show success and redirect to feed
      if (Platform.OS === 'web') {
        window.alert('Commitment marked as ABANDONED permanently');
      } else {
        Alert.alert('Abandoned', 'Commitment marked as ABANDONED permanently');
      }
      
      navigation.navigate('publicFeed');
    } catch (err) {
      console.error('Error abandoning commitment:', err);
      if (Platform.OS === 'web') {
        window.alert('Failed to abandon commitment: ' + (err as Error).message);
      } else {
        Alert.alert('Error', 'Failed to abandon commitment: ' + (err as Error).message);
      }
    }
  };

  const handleMarkComplete = async () => {
    if (!activeCommitment) return;
    try {
      const isLocal = String(activeCommitment.id).startsWith('local-');
      const completedAt = new Date().toISOString();
      
      if (isLocal) {
        // For local-only commitments, insert as a new completed record
        await supabase
          .from('commitments')
          .insert({
            commitment_text: activeCommitment.commitment_text,
            daily_action: activeCommitment.daily_action,
            founder_type: activeCommitment.founder_type,
            status: 'completed',
            completed: true,
            completed_at: completedAt,
            deadline: activeCommitment.deadline,
            created_at: activeCommitment.created_at || new Date().toISOString(),
          });
      } else {
        await supabase
          .from('commitments')
          .update({ status: 'completed', completed: true, completed_at: completedAt })
          .eq('id', activeCommitment.id);
      }

      // Set completion flag
      await AsyncStorage.setItem('foundertype_has_completed_commitment', 'true');
      await AsyncStorage.removeItem('foundertype_has_active_commitment');
      await AsyncStorage.removeItem('foundertype_active_commitment_text');
      await AsyncStorage.removeItem('foundertype_active_deadline');
      await AsyncStorage.removeItem('foundertype_active_commitment');
      await AsyncStorage.removeItem(CHECK_IN_KEY);

      navigation.navigate('landing');
    } catch (err) {
      console.error('Error marking complete:', err);
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
          <Text style={[styles.dayNumber, isCompleted && styles.completedDayText]}>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('landing')} style={styles.backButton}>
          <Text style={styles.backText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Day {checkInData.currentDay} of 30</Text>

        {activeCommitment && (
          <View style={styles.commitmentBanner}>
            <Text style={styles.commitmentBannerLabel}>YOUR COMMITMENT</Text>
            <Text style={styles.commitmentBannerText}>{activeCommitment.commitment_text}</Text>
            {todayAlreadyCheckedIn && (
              <Text style={styles.alreadyCheckedIn}>✓ Checked in today</Text>
            )}
          </View>
        )}

        <View style={styles.actionContainer}>
          <Text style={styles.actionLabel}>Today's Action</Text>
          {todayAction ? (
            <View>
              <Text style={styles.actionText}>{todayAction}</Text>
              <TouchableOpacity style={styles.editActionButton} onPress={handleEditCommitment}>
                <Text style={styles.editActionButtonText}>Edit Commitment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.actionText}>Add a daily action to start checking in.</Text>
              <TouchableOpacity style={styles.editActionButton} onPress={handleEditCommitment}>
                <Text style={styles.editActionButtonText}>Add Daily Action</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBrokenButton} onPress={() => { console.log('Delete button pressed'); handleDeleteBroken(); }}>
                <Text style={styles.deleteBrokenButtonText}>Delete Commitment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Day 30 Decision Section */}
        {(isDeadlinePassed || daysSinceStart >= 30 || checkInData.completedDays.length >= 30) && (
          <View style={styles.decisionCard}>
            <Text style={styles.decisionTitle}>Time's Up</Text>
            <Text style={styles.decisionText}>
              Your 30-day deadline has passed. Mark it complete or abandon it.
            </Text>
            <View style={styles.decisionButtons}>
              <TouchableOpacity style={styles.completeButton} onPress={handleMarkComplete}>
                <Text style={styles.completeButtonText}>Mark Complete ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.abandonBigButton} onPress={() => { console.log('Abandon big button pressed'); handleAbandon(); }}>
                <Text style={styles.abandonBigText}>Abandon It ✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.decisionNote}>
              24 hours to respond. No response = automatic abandon.
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.doneButton, (todayAlreadyCheckedIn || !todayAction) && styles.doneButtonDisabled]}
            onPress={handleDoneToday}
            disabled={todayAlreadyCheckedIn || !todayAction}
          >
            <Text style={styles.doneButtonText}>
              {todayAlreadyCheckedIn ? '✓ Completed Today' : !todayAction ? 'No Action Defined' : 'Done Today'}
            </Text>
          </TouchableOpacity>
        </View>

        {checkInData.streak > 1 && (
          <Text style={styles.streakText}> {Math.min(checkInData.streak, 30)} day streak</Text>
        )}

        <View style={styles.gridContainer}>
          <Text style={styles.gridLabel}>30-Day Progress</Text>
          <View style={styles.dayGrid}>{renderDayGrid()}</View>
        </View>

        {/* Abandon link */}
        <TouchableOpacity style={styles.abandonLink} onPress={() => { console.log('Abandon link pressed'); handleAbandon(); }}>
          <Text style={styles.abandonText}>I'm abandoning this commitment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20, paddingTop: 40 },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' },
  loadingText: { color: '#FFFFFF', textAlign: 'center', marginTop: 100 },
  header: { fontSize: 32, fontWeight: 'bold', color: '#3B82F6', textAlign: 'center', marginBottom: 20 },
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
  alreadyCheckedIn: { color: '#22C55E', fontSize: 12, fontWeight: '600', marginTop: 8 },
  actionContainer: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 12, marginBottom: 30 },
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
    streakText: { fontSize: 18, color: '#FF6B35', textAlign: 'center', marginBottom: 20 },
  gridContainer: { marginTop: 20 },
  gridLabel: { fontSize: 16, color: '#888888', textAlign: 'center', marginBottom: 15 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  daySquare: {
    width: 40, height: 40,
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
  abandonText: { color: '#444444', fontSize: 13, textDecorationLine: 'underline' },
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
  deleteBrokenButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBrokenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
