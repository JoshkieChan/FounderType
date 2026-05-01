import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface Commitment {
  id: string;
  founder_type: string;
  commitment_text: string;
  deadline: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  check_ins: string[];
  completed: boolean;
  abandoned: boolean;
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status, daysRemaining }: { status: string; daysRemaining: number }) {
  if (status === 'completed') {
    return (
      <View style={[badgeStyles.badge, badgeStyles.completed]}>
        <Text style={badgeStyles.text}>✓ Done</Text>
      </View>
    );
  }
  if (status === 'abandoned') {
    return (
      <View style={[badgeStyles.badge, badgeStyles.abandoned]}>
        <Text style={[badgeStyles.text, badgeStyles.abandonedText]}>Abandoned</Text>
      </View>
    );
  }
  return (
    <View style={[badgeStyles.badge, badgeStyles.active]}>
      <Text style={badgeStyles.text}>
        In Progress · {daysRemaining > 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  active: { backgroundColor: 'rgba(59,130,246,0.15)' },
  completed: { backgroundColor: 'rgba(34,197,94,0.15)' },
  abandoned: { backgroundColor: 'rgba(107,114,128,0.15)' },
  text: { color: '#3B82F6', fontSize: 11, fontWeight: '600' },
  abandonedText: { color: '#6B7280' },
});

function CommitmentCard({ item }: { item: Commitment }) {
  const daysRemaining = getDaysRemaining(item.deadline);
  const borderColor =
    item.status === 'completed' ? '#22C55E' :
    item.status === 'abandoned' ? '#6B7280' :
    '#3B82F6';

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.cardTopRow}>
        <Text style={styles.founderTypeLabel}>
          {item.founder_type?.toUpperCase() || 'ANONYMOUS FOUNDER'}
        </Text>
        <Text style={styles.daysLabel}>
          {item.status === 'active'
            ? daysRemaining > 0
              ? `${daysRemaining} days left`
              : `${Math.abs(daysRemaining)} days overdue`
            : ''}
        </Text>
      </View>

      <Text style={styles.commitmentText}>{item.commitment_text}</Text>

      <View style={styles.cardBottomRow}>
        <StatusBadge status={item.status} daysRemaining={daysRemaining} />
        <Text style={styles.deadlineLabel}>by {formatDate(item.deadline)}</Text>
      </View>
    </View>
  );
}

export default function PublicFeedScreen({ navigation }: { navigation: any }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCommitments = useCallback(async () => {
    try {
      const { data, error, count } = await supabase
        .from('commitments')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching commitments:', error);
        return;
      }

      setCommitments((data as Commitment[]) || []);

      // Count only active ones this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const activeThisMonth = (data || []).filter(
        (c: Commitment) => new Date(c.created_at) >= thisMonth
      ).length;
      setTotalCount(activeThisMonth);
    } catch (err) {
      console.error('Error fetching commitments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommitments();
  };

  const handleMakeCommitment = () => {
    navigation.navigate('commitment');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3B82F6" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={commitments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommitmentCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('landing')} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>WHO'S BUILDING</Text>
            <Text style={styles.headline}>Real commitments.{'\n'}Real deadlines.{'\n'}No excuses.</Text>
            <Text style={styles.countText}>{totalCount} active commitment{totalCount !== 1 ? 's' : ''} this month</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No commitments yet.</Text>
            <Text style={styles.emptySubtext}>Be the first.</Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.ctaButton} onPress={handleMakeCommitment}>
            <Text style={styles.ctaButtonText}>Make Your Own Commitment →</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '500',
  },
  sectionLabel: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 12,
  },
  countText: {
    color: '#555555',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#141414',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  founderTypeLabel: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  daysLabel: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '500',
  },
  commitmentText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineLabel: {
    color: '#555555',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#555555',
    fontSize: 15,
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
