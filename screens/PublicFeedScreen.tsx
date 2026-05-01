import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getCurrentUserId } from '../lib/storage';

interface Commitment {
  id: string;
  user_id: string | null;
  founder_type: string;
  commitment_text: string;
  daily_action: string | null;
  deadline: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  check_ins: string[];
  completed: boolean;
  abandoned: boolean;
  abandoned_at: string | null;
  abandoned_on_day: number | null;
  edited_at: string | null;
}

function normalizeCommitment(raw: any): Commitment {
  return {
    id: raw.id || `local-${raw.created_at || Date.now()}`,
    user_id: raw.user_id || null,
    founder_type: raw.founder_type || 'Founder',
    commitment_text: raw.commitment_text || '',
    daily_action: raw.daily_action || null,
    deadline: raw.deadline || new Date().toISOString(),
    status: raw.status || 'active',
    created_at: raw.created_at || new Date().toISOString(),
    check_ins: raw.check_ins || [],
    completed: !!raw.completed,
    abandoned: !!raw.abandoned,
    abandoned_at: raw.abandoned_at || null,
    abandoned_on_day: raw.abandoned_on_day || null,
    edited_at: raw.edited_at || null,
  };
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#3B82F6';
    case 'completed': return '#22C55E';
    case 'abandoned': return '#EF4444';
    default: return '#888888';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'ACTIVE';
    case 'completed': return 'COMPLETED';
    case 'abandoned': return 'ABANDONED';
    default: return 'UNKNOWN';
  }
}

function isEditable(item: Commitment, userId: string | null): boolean {
  // Show buttons for all active commitments within 24 hours
  if (item.status !== 'active') return false;
  const hoursSincePosted = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
  return hoursSincePosted < 24;
}

function isLocked(item: Commitment, userId: string | null): boolean {
  if (!userId || item.user_id !== userId) return false;
  if (item.status !== 'active') return false;
  const hoursSincePosted = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
  return hoursSincePosted >= 24;
}

function getHoursRemaining(item: Commitment): number {
  const hoursSincePosted = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
  return Math.max(0, 24 - hoursSincePosted);
}

export default function PublicFeedScreen({ navigation }: { navigation: any }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadCommitments = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const storedCommitment = await AsyncStorage.getItem('foundertype_active_commitment');
      const storedText = await AsyncStorage.getItem('foundertype_active_commitment_text');
      const storedDeadline = await AsyncStorage.getItem('foundertype_active_deadline');
      const localCommitment = storedCommitment
        ? normalizeCommitment(JSON.parse(storedCommitment))
        : storedText
          ? normalizeCommitment({
              id: 'local-active-commitment',
              commitment_text: storedText,
              deadline: storedDeadline,
              status: 'active',
              created_at: new Date().toISOString(),
            })
          : null;

      if (error) {
        console.error('Error loading commitments:', error);
      }

      const remoteCommitments = error ? [] : (data || []).map(normalizeCommitment);
      const deletedIds = JSON.parse(localStorage.getItem('deleted_commitments') || '[]');
      const mergedCommitments = localCommitment &&
        !remoteCommitments.some(c => c.id === localCommitment.id || c.commitment_text === localCommitment.commitment_text)
        ? [localCommitment, ...remoteCommitments]
        : remoteCommitments;

      setCommitments(mergedCommitments.filter(c => !deletedIds.includes(c.id)));
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadCommitments();
    // Get current user for edit/delete permissions
    getCurrentUserId().then(setCurrentUserId);
  }, [loadCommitments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommitments();
  }, [loadCommitments]);

  const handleEditCommitment = (item: Commitment) => {
    navigation.navigate('commitment', { 
      editMode: true, 
      commitmentId: item.id,
      initialText: item.commitment_text,
      initialDailyAction: item.daily_action || '',
      initialDeadline: item.deadline
    });
  };

  const handleDeleteCommitment = async (item: Commitment) => {
    const message = 'This will permanently remove your commitment from the feed. You can post a new one anytime.';
    if (Platform.OS === 'web') {
      if (window.confirm(message + ' Are you sure?')) {
        // Immediately remove from UI
        setCommitments(prev => prev.filter(c => c.id !== item.id));
        
        // Store deleted IDs to prevent them from reappearing
        const deletedIds = JSON.parse(localStorage.getItem('deleted_commitments') || '[]');
        deletedIds.push(item.id);
        localStorage.setItem('deleted_commitments', JSON.stringify(deletedIds));
        
        window.alert('Commitment deleted successfully!');
      }
    } else {
      Alert.alert(
        'Delete This Commitment?',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete Commitment', 
            style: 'destructive',
            onPress: () => {
              // Immediately remove from UI
              setCommitments(prev => prev.filter(c => c.id !== item.id));
              
              // Store deleted IDs to prevent them from reappearing
              const deletedIds = JSON.parse(localStorage.getItem('deleted_commitments') || '[]');
              deletedIds.push(item.id);
              localStorage.setItem('deleted_commitments', JSON.stringify(deletedIds));
              
              Alert.alert('Success', 'Commitment deleted successfully!');
            }
          },
        ]
      );
    }
  };

  const renderCommitment = ({ item }: { item: Commitment }) => {
    const daysRemaining = getDaysRemaining(item.deadline);
    const isOverdue = daysRemaining < 0 && item.status === 'active';
    const editable = isEditable(item, currentUserId);
    const locked = isLocked(item, currentUserId);
    const hoursRemaining = editable ? Math.floor(getHoursRemaining(item)) : 0;

    return (
      <View style={styles.commitmentCard}>
        <View style={styles.commitmentHeader}>
          <View style={styles.founderTypeContainer}>
            <Text style={styles.founderType}>{item.founder_type}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.commitmentText}>"{item.commitment_text}"</Text>

        {item.daily_action && (
          <View style={styles.dailyActionContainer}>
            <Text style={styles.dailyActionLabel}>Daily:</Text>
            <Text style={styles.dailyActionText}>{item.daily_action}</Text>
          </View>
        )}

        {item.status === 'abandoned' && item.abandoned_on_day && (
          <Text style={styles.abandonedText}>
            Abandoned on Day {item.abandoned_on_day}/30
          </Text>
        )}

        <View style={styles.commitmentFooter}>
          <View style={styles.deadlineContainer}>
            <Text style={styles.deadlineLabel}>Deadline:</Text>
            <Text style={[
              styles.deadlineText,
              isOverdue && styles.overdueText
            ]}>
              {new Date(item.deadline).toLocaleDateString()}
            </Text>
            <Text style={[
              styles.daysRemaining,
              isOverdue && styles.overdueText
            ]}>
              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
            </Text>
          </View>

          {item.check_ins && item.check_ins.length > 0 && (
            <View style={styles.checkInsContainer}>
              <Text style={styles.checkInsLabel}>Check-ins: {item.check_ins.length}</Text>
            </View>
          )}
        </View>

        {/* Edit/Delete buttons for owner within 24 hours */}
        {editable && (
          <View style={styles.editActions}>
            <Text style={styles.editableText}>Editable for {hoursRemaining} hours</Text>
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => handleEditCommitment(item)}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteCommitment(item)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lock indicator for owner past 24 hours */}
        {locked && (
          <View style={styles.lockIndicator}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>Locked after 24 hours</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading commitments...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCommitments}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>See Who's Building</Text>
        <View style={styles.placeholder} />
      </View>

      {commitments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏗️</Text>
          <Text style={styles.emptyTitle}>No commitments yet</Text>
          <Text style={styles.emptyText}>
            Be the first to make a commitment and inspire others!
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('questions')}
          >
            <Text style={styles.startButtonText}>Start Building</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={commitments}
          renderItem={renderCommitment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  commitmentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  commitmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  founderTypeContainer: {
    flex: 1,
  },
  founderType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  date: {
    color: '#888888',
    fontSize: 12,
  },
  commitmentText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  commitmentFooter: {
    gap: 8,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineLabel: {
    color: '#888888',
    fontSize: 12,
  },
  deadlineText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  daysRemaining: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  overdueText: {
    color: '#EF4444',
  },
  checkInsContainer: {
    alignItems: 'flex-end',
  },
  checkInsLabel: {
    color: '#888888',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CCCCCC',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  editableText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 6,
  },
  lockIcon: {
    fontSize: 12,
    color: '#93C5FD',
  },
  lockText: {
    fontSize: 11,
    color: '#93C5FD',
    fontStyle: 'italic',
  },
  dailyActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  dailyActionLabel: {
    fontSize: 14,
    color: '#93C5FD',
    marginRight: 6,
  },
  dailyActionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  abandonedText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    marginBottom: 8,
  },
});
