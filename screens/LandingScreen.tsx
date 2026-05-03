import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadProfile } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { usePublicFeed } from '../hooks/usePublicFeed';
import { Commitment } from '../types/commitment';

function getStatusColor(s: string) {
  if (s === 'completed') return '#22C55E'; // GREEN for COMPLETED
  if (s === 'active') return '#3B82F6';    // BLUE for ACTIVE  
  if (s === 'abandoned') return '#EF4444'; // RED for ABANDONED
  return '#888888';
}

function getStatusLabel(s: string) {
  if (s === 'completed') return 'COMPLETED';
  if (s === 'active') return 'ACTIVE';
  if (s === 'abandoned') return 'ABANDONED';
  return 'UNKNOWN';
}

function getDaysRemaining(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getTimelineText(item: Commitment): string {
  const now = new Date();
  
  if (item.status === 'completed') {
    const targetDate = item.completed_at ? new Date(item.completed_at) : new Date(item.created_at);
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `Completed ${diffDays === 0 ? 'today' : `${diffDays} days ago`}`;
  }
  
  if (item.status === 'abandoned') {
    const targetDate = item.abandoned_at ? new Date(item.abandoned_at) : new Date(item.deadline);
    const diffTime = Math.abs(now.getTime() - targetDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `Abandoned ${diffDays === 0 ? 'today' : `${diffDays} days ago`}`;
  }
  
  const diffTime = Math.abs(now.getTime() - new Date(item.created_at).getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return `Started ${diffDays === 0 ? 'today' : `${diffDays} days ago`}`;
}

function getUserLabel(item: Commitment) {
  if (!item.founder_type) return 'Founder';
  // Prevent duplicate "Founder (Founder)"
  if (item.founder_type.toLowerCase().includes('founder')) return item.founder_type;
  return `Founder (${item.founder_type})`;
}


function isEditable(item: Commitment, userId: string | null): boolean {
  if (!userId || item.user_id !== userId) return false;
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

import { useUserContext } from '../context/UserContext';

export default function LandingScreen({ navigation }: { navigation: any }) {
  const { 
    activeCommitment, 
    currentSlotStatus, 
    lastCycleResult, 
    refreshActiveCommitment,
    user
  } = useUserContext();

  const {
    commitments: allCommitments,
    loading,
    refreshing,
    loadCommitments,
  } = usePublicFeed('active');

  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  // Cap the embedded feed to a small preview subset
  const commitments = allCommitments.slice(0, isWide ? 9 : 6);

  const onRefresh = async () => {
    await Promise.all([
      loadCommitments(),
      refreshActiveCommitment()
    ]);
  };

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id).then(p => {
        if (p) setHasSavedProfile(true);
      }).catch(() => {});
    }
  }, [user]);

  const handleEditCommitment = (item: Commitment) => {
    // Navigate to commitment screen with edit mode
    (navigation as any).navigate('commitment', { 
      editMode: true, 
      commitmentId: item.id,
      initialText: item.commitment_text,
      initialDailyAction: item.daily_action || '',
      initialDeadline: item.deadline
    });
  };

  const handleDeleteCommitment = async (item: Commitment) => {
    const message = 'This will permanently remove your commitment from the feed. You can post a new one anytime.';
    const doDelete = async () => {
      try {
        await supabase.from('commitments').delete().eq('id', item.id);
        await loadCommitments(); // Refresh feed
        await refreshActiveCommitment(); // Sync context
      } catch (error) {
        console.error('Error deleting commitment:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to delete commitment. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to delete commitment. Please try again.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message + ' Are you sure?')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete This Commitment?',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Commitment', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleViewProgress = () => {
    if (activeCommitment) {
      navigation.navigate('dailyCheckIn', { commitment: activeCommitment });
    } else {
      Alert.alert('Error', 'No active commitment found');
    }
  };


  const FeedCard = ({ item, index }: { item: Commitment; index: number }) => (
    <View style={[styles.feedCard, isWide && styles.feedCardWide]}>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
      </View>
      <Text style={styles.feedUser}>{getUserLabel(item)}</Text>
      <Text style={styles.feedCommitment}>"{item.commitment_text}"</Text>
      <Text style={styles.feedTimeline}>{getTimelineText(item)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* RETURNING USER BANNERS */}
      {currentSlotStatus === 'active' && activeCommitment && (
        <View style={[styles.statusBanner, { backgroundColor: '#0D1F3A', borderColor: '#1E3A5F' }]}>
          <Text style={[styles.statusLabel, { color: '#3B82F6' }]}>ACTIVE COMMITMENT</Text>
          <Text style={styles.statusText}>"{activeCommitment.commitment_text}"</Text>
          <Text style={[styles.statusMeta, { color: '#93C5FD' }]}>
            Day {activeCommitment.check_ins.length + 1} of 30
          </Text>
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={[styles.statusCta, { backgroundColor: '#F59E0B' }]}
              onPress={handleViewProgress}
            >
              <Text style={styles.statusCtaText}>View Progress →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentSlotStatus === 'none' && lastCycleResult === 'completed' && (
        <View style={[styles.statusBanner, { backgroundColor: '#064E3B', borderColor: '#065F46' }]}>
          <Text style={[styles.statusLabel, { color: '#10B981' }]}>COMMITMENT COMPLETED</Text>
          <Text style={styles.statusText}>You followed through. Post the next public 30-day commitment when you're ready.</Text>
          <TouchableOpacity style={[styles.statusCta, { backgroundColor: '#10B981' }]} onPress={() => navigation.navigate('commitment')}>
            <Text style={styles.statusCtaText}>Post Next Commitment →</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentSlotStatus === 'none' && lastCycleResult === 'abandoned' && (
        <View style={[styles.statusBanner, { backgroundColor: '#450A0A', borderColor: '#7F1D1D' }]}>
          <Text style={[styles.statusLabel, { color: '#EF4444' }]}>COMMITMENT ABANDONED</Text>
          <Text style={styles.statusText}>That one didn't stick. Post your next public 30-day commitment when you're ready.</Text>
          <TouchableOpacity style={[styles.statusCta, { backgroundColor: '#EF4444' }]} onPress={() => navigation.navigate('commitment')}>
            <Text style={styles.statusCtaText}>Post Next Commitment →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroHeadline}>You've Started Before. You've Stopped Before. This Time It's Public.</Text>
        <Text style={styles.heroSub}>Post a 30-day commitment. Complete it or everyone sees you quit.</Text>
        <TouchableOpacity style={styles.primaryCta} onPress={() => navigation.navigate('commitment')}>
          <Text style={styles.primaryCtaText}>
            {lastCycleResult === 'completed' ? 'Post Your Next Commitment' : 'Post Your First Commitment'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryCta} onPress={() => navigation.navigate('onboarding')}>
          <Text style={styles.secondaryCtaText}>Take the diagnostic first</Text>
        </TouchableOpacity>
      </View>

      {/* EMBEDDED FEED */}
      <View style={styles.feedSection}>
        <Text style={styles.feedTitle}>Who's Building Right Now</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#111111" style={{ marginVertical: 40 }} />
        ) : commitments.length === 0 ? (
          <Text style={styles.feedEmpty}>No commitments yet. Be the first.</Text>
        ) : (
          <View style={styles.feedGrid}>
            {commitments.slice(0, isWide ? 9 : 6).map((item, i) => (
              <FeedCard key={item.id || i} item={item} index={i} />
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.viewAllLink} onPress={() => navigation.navigate('publicFeed')}>
          <Text style={styles.viewAllText}>See All Commitments →</Text>
        </TouchableOpacity>
      </View>

      {/* HOW IT WORKS */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How It Works</Text>
        <View style={styles.steps}>
          <View style={[styles.step, isWide && styles.stepWide]}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepTitle}>Post One Commitment</Text>
            <Text style={styles.stepDesc}>One specific thing you'll do in 30 days. It goes public immediately.</Text>
          </View>
          <View style={[styles.step, isWide && styles.stepWide]}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepTitle}>Complete It or Everyone Sees</Text>
            <Text style={styles.stepDesc}>At day 30, mark it complete or it gets flagged as abandoned. No hiding. No edits.</Text>
          </View>
          <View style={[styles.step, isWide && styles.stepWide]}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepTitle}>Own the Outcome</Text>
            <Text style={styles.stepDesc}>Complete it and it stays green. Abandon it and it stays public. Either way, the record is real.</Text>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('privacyPolicy')}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('terms')}>
          <Text style={styles.footerLink}>Terms of Service</Text>
        </TouchableOpacity>
        {hasSavedProfile && (
          <TouchableOpacity onPress={() => navigation.navigate('results')}>
            <Text style={styles.footerLink}>View Your Last Results</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingBottom: 40 },

  // HERO
  hero: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  heroHeadline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 480,
  },
  primaryCta: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 280,
    alignItems: 'center',
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryCta: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryCtaText: {
    color: '#555555',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  // FEED
  feedSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  feedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feedCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  feedCardWide: {
    width: '48%',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  feedUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  feedCommitment: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  feedTimeline: {
    fontSize: 12,
    color: '#888888',
  },
  feedEmpty: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 16,
    marginVertical: 32,
  },
  viewAllLink: {
    marginTop: 8,
    alignSelf: 'center',
  },
  viewAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // HOW IT WORKS
  howItWorks: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#0A0A0A',
  },
  howTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  step: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 24,
    marginBottom: 16,
  },
  stepWide: {
    width: '30%',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    backgroundColor: '#333333',
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },

  // FINAL CTA
  finalCta: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  finalHeadline: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },

  // FOOTER
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    color: '#888888',
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  // RETURNING USER BANNERS
  statusBanner: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statusMeta: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusDeleteCta: {
    backgroundColor: '#B91C1C',
  },
  statusCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  badgesSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  badgesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 2,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 6,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeName: {
    color: '#CCCCCC',
    fontSize: 13,
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
});
