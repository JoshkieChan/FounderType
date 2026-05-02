import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProfile, getCurrentUserId, getCachedActiveCommitment } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface Commitment {
  id: string;
  user_id: string | null;
  founder_type: string | null;
  commitment_text: string;
  daily_action?: string | null;
  deadline: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  completed_at: string | null;
  edited_at: string | null;
}

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
  const posted = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  let timeline = '';
  
  if (item.status === 'completed' && item.completed_at) {
    const days = Math.ceil((new Date(item.completed_at).getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
    timeline = `Completed in ${days} days`;
  } else if (item.status === 'abandoned') {
    const days = Math.abs(getDaysRemaining(item.deadline));
    timeline = `Expired ${days} days ago`;
  } else {
    timeline = `${getDaysRemaining(item.deadline)} days left`;
  }
  
  // Add edit timestamp if edited
  if (item.edited_at && item.edited_at !== item.created_at) {
    const hoursSinceEdit = (Date.now() - new Date(item.edited_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceEdit < 1) {
      timeline += ' · Edited just now';
    } else {
      timeline += ` · Edited ${Math.floor(hoursSinceEdit)} hours ago`;
    }
  }
  
  return `${timeline} · Posted ${posted}`;
}

function getUserLabel(item: Commitment) {
  if (!item.founder_type) return 'Founder';
  // Prevent duplicate "Founder (Founder)"
  if (item.founder_type.toLowerCase().includes('founder')) return item.founder_type;
  return `Founder (${item.founder_type})`;
}

type UserStatus = 'none' | 'active' | 'completed';

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

export default function LandingScreen({ navigation }: { navigation: any }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>('none');
  const [activeText, setActiveText] = useState('');
  const [activeDays, setActiveDays] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const loadCommitments = useCallback(async () => {
    try {
      // Load real commitments from database
      const { data } = await supabase.from('commitments').select('*').order('created_at', { ascending: false }).limit(20);
      const realCommitments = data || [];

      // Clean up any [date] placeholders in existing commitments
      const cleanedCommitments = realCommitments.map(commitment => ({
        ...commitment,
        commitment_text: commitment.commitment_text.replace(/\[date\]/g, 'May 30, 2026')
      }));

      // Add placeholder completed/abandoned commitments
      const now = new Date();
      const placeholders: Commitment[] = [
        // COMPLETED examples
        {
          id: 'placeholder-completed-1',
          user_id: null,
          founder_type: 'The Unmonetized Maker',
          commitment_text: 'Launch MVP and get 5 paying customers by April 20',
          deadline: '2026-04-20T00:00:00.000Z',
          status: 'completed',
          created_at: '2026-03-23T00:00:00.000Z',
          completed_at: '2026-04-20T00:00:00.000Z',
          edited_at: null,
        },
        {
          id: 'placeholder-completed-2',
          user_id: null,
          founder_type: 'The Grinder',
          commitment_text: 'Ship v1 landing page with payment integration by April 10',
          deadline: '2026-04-10T00:00:00.000Z',
          status: 'completed',
          created_at: '2026-03-11T00:00:00.000Z',
          completed_at: '2026-03-30T00:00:00.000Z',
          edited_at: null,
        },
        // ABANDONED examples
        {
          id: 'placeholder-abandoned-1',
          user_id: null,
          founder_type: null,
          commitment_text: 'Build email list to 100 subscribers by April 1',
          deadline: '2026-04-01T00:00:00.000Z',
          status: 'abandoned',
          created_at: '2026-03-01T00:00:00.000Z',
          completed_at: null,
          edited_at: null,
        },
        {
          id: 'placeholder-abandoned-2',
          user_id: null,
          founder_type: 'The Sprint Seeker',
          commitment_text: 'Post 10 pieces of content on LinkedIn by April 5',
          deadline: '2026-04-05T00:00:00.000Z',
          status: 'abandoned',
          created_at: '2026-03-06T00:00:00.000Z',
          completed_at: null,
          edited_at: null,
        },
        {
          id: 'placeholder-abandoned-3',
          user_id: null,
          founder_type: null,
          commitment_text: 'Get first paying customer by March 25',
          deadline: '2026-03-25T00:00:00.000Z',
          status: 'abandoned',
          created_at: '2026-02-23T00:00:00.000Z',
          completed_at: null,
          edited_at: null,
        },
      ];

      // Combine real and placeholder commitments, sort by most recent activity date
      const allCommitments = [...cleanedCommitments, ...placeholders];
      allCommitments.sort((a: any, b: any) => {
        const dateA = new Date(a.completed_at || a.abandoned_at || a.created_at).getTime();
        const dateB = new Date(b.completed_at || b.abandoned_at || b.created_at).getTime();
        return dateB - dateA;
      });
      
      setCommitments(allCommitments);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadCommitments();
    (async () => {
      try {
        const profileUserId = await getCurrentUserId();
        if (profileUserId) {
          const p = await loadProfile(profileUserId);
          if (p) setHasSavedProfile(true);
        }

        // Check user commitment status
        const hasActive = await AsyncStorage.getItem('foundertype_has_active_commitment');
        const hasCompleted = await AsyncStorage.getItem('foundertype_has_completed_commitment');

        if (hasActive === 'true') {
          const text = await AsyncStorage.getItem('foundertype_active_commitment_text') || '';
          const deadline = await AsyncStorage.getItem('foundertype_active_deadline');
          const days = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
          setActiveText(text);
          setActiveDays(days);
          setUserStatus('active');
        } else {
          if (hasCompleted === 'true') {
            setUserStatus('completed');
            // Clear flag so it disappears on next refresh
            await AsyncStorage.removeItem('foundertype_has_completed_commitment');
          } else {
            setUserStatus('none');
          }
        }

        // Get current user for edit/delete permissions
        const currentId = await getCurrentUserId();
        setCurrentUserId(currentId);
      } catch (e) { /* ignore */ }
    })();
  }, [loadCommitments]);

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
    if (Platform.OS === 'web') {
      if (window.confirm(message + ' Are you sure?')) {
        try {
          await supabase.from('commitments').delete().eq('id', item.id);
          loadCommitments(); // Refresh feed
        } catch (error) {
          console.error('Error deleting commitment:', error);
          window.alert('Failed to delete commitment. Please try again.');
        }
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
            onPress: async () => {
              try {
                await supabase.from('commitments').delete().eq('id', item.id);
                loadCommitments(); // Refresh feed
              } catch (error) {
                console.error('Error deleting commitment:', error);
                Alert.alert('Error', 'Failed to delete commitment. Please try again.');
              }
            }
          },
        ]
      );
    }
  };

  const handleViewProgress = async () => {
    try {
      const cachedCommitment = await getCachedActiveCommitment();
      if (cachedCommitment) {
        navigation.navigate('dailyCheckIn', { commitment: cachedCommitment });
        return;
      }

      const userId = await getCurrentUserId();
      if (userId) {
        const { data: commitment, error } = await supabase
          .from('commitments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && commitment) {
          await AsyncStorage.setItem('foundertype_active_commitment', JSON.stringify(commitment));
          navigation.navigate('dailyCheckIn', { commitment });
          return;
        }
      }

      if (activeText) {
        const deadline = await AsyncStorage.getItem('foundertype_active_deadline');
        navigation.navigate('dailyCheckIn', {
          commitment: {
            id: 'local-active-commitment',
            commitment_text: activeText,
            deadline,
            status: 'active',
            check_ins: [],
          },
        });
        return;
      }

      Alert.alert('Error', 'No active commitment found');
    } catch (err) {
      console.error('Failed to load commitment:', err);
      Alert.alert('Error', 'Failed to load commitment');
    }
  };

  const handleDeleteActiveCommitment = async () => {
    const message = 'This will delete the active commitment so you can post a new one for testing.';

    const runDelete = async () => {
      try {
        const cachedCommitment = await getCachedActiveCommitment();
        const commitmentId = cachedCommitment?.id;

        if (commitmentId && !String(commitmentId).startsWith('local-')) {
          const { error } = await supabase
            .from('commitments')
            .delete()
            .eq('id', commitmentId);

          if (error) {
            throw error;
          }
        }

        await AsyncStorage.multiRemove([
          'foundertype_has_active_commitment',
          'foundertype_active_commitment_text',
          'foundertype_active_deadline',
          'foundertype_active_commitment',
          'foundertype_commitment',
        ]);

        setActiveText('');
        setActiveDays(0);
        setUserStatus('none');
        await loadCommitments();

        if (Platform.OS === 'web') {
          window.alert('Active commitment deleted');
        } else {
          Alert.alert('Deleted', 'Active commitment deleted');
        }
      } catch (err) {
        console.error('Failed to delete active commitment:', err);
        if (Platform.OS === 'web') {
          window.alert('Failed to delete active commitment');
        } else {
          Alert.alert('Error', 'Failed to delete active commitment');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        await runDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Active Commitment?',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { void runDelete(); } },
      ]
    );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* RETURNING USER BANNERS */}
      {userStatus === 'active' && (
        <View style={[styles.statusBanner, { backgroundColor: '#0D1F3A', borderColor: '#1E3A5F' }]}>
          <Text style={[styles.statusLabel, { color: '#3B82F6' }]}>ACTIVE COMMITMENT</Text>
          <Text style={styles.statusText}>"{activeText}"</Text>
          <Text style={[styles.statusMeta, { color: '#93C5FD' }]}>{activeDays} days left</Text>
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={[styles.statusCta, { backgroundColor: '#F59E0B' }]}
              onPress={handleViewProgress}
            >
              <Text style={styles.statusCtaText}>View Progress →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusCta, styles.statusDeleteCta]}
              onPress={handleDeleteActiveCommitment}
            >
              <Text style={styles.statusCtaText}>Delete for Testing</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {userStatus === 'completed' && (
        <View style={[styles.statusBanner, { backgroundColor: '#064E3B', borderColor: '#065F46' }]}>
          <Text style={[styles.statusLabel, { color: '#10B981' }]}>COMMITMENT COMPLETED</Text>
          <Text style={styles.statusText}>You followed through. Post the next public 30-day commitment when you're ready.</Text>
          <TouchableOpacity style={[styles.statusCta, { backgroundColor: '#10B981' }]} onPress={() => navigation.navigate('commitment')}>
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
            {userStatus === 'completed' ? 'Post Your Next Commitment' : 'Post Your First Commitment'}
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
        {hasSavedProfile && (
          <TouchableOpacity onPress={() => navigation.navigate('results')}>
            <Text style={styles.footerLink}>View Your Last Results</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingBottom: 40 },

  // HERO
  hero: {
    paddingHorizontal: 24,
    paddingTop: 80,
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
    marginTop: 20,
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
