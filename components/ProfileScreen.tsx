import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar?: string;
  founderType: string;
  completedCommitments: number;
  currentStreak: number;
  longestStreak: number;
  joinedAt: Date;
  followers: number;
  following: number;
  isFollowing: boolean;
}

interface ProfileScreenProps {
  userId: string;
  navigation?: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

export default function ProfileScreen({ userId, navigation }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      // Mock profile data - replace with actual API call
      const mockProfile: UserProfile = {
        id: userId,
        name: 'Sarah Chen',
        username: 'sarahchen',
        bio: 'Product builder passionate about creating tools that help founders succeed. Currently building a SaaS for startup analytics.',
        founderType: 'Product Builder',
        completedCommitments: 12,
        currentStreak: 7,
        longestStreak: 21,
        joinedAt: new Date('2024-01-15'),
        followers: 234,
        following: 89,
        isFollowing: false,
      };
      
      setProfile(mockProfile);
      setIsFollowing(mockProfile.isFollowing);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    if (!profile) return;
    
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    
    // Update profile stats
    setProfile({
      ...profile,
      followers: newFollowingState ? profile.followers + 1 : profile.followers - 1,
      isFollowing: newFollowingState,
    });
    
    // Here you would make an API call to follow/unfollow
    console.log(newFollowingState ? 'Following' : 'Unfollowing', profile.username);
  };

  const handleMessage = () => {
    Alert.alert(
      'Send Message',
      'Message functionality would be implemented here',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const formatJoinDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFounderTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Product Builder': '#6366f1',
      'Content Creator': '#8b5cf6',
      'Sales Expert': '#10b981',
      'Growth Hacker': '#f59e0b',
      'Visionary': '#ef4444',
      'Analyst': '#3b82f6',
      'Communicator': '#ec4899',
      'Networker': '#14b8a6',
    };
    return colors[type] || '#6b7280';
  };

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  if (loading) {
    return (
      <Container style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionsButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profile.avatar || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <View style={[styles.founderTypeBadge, { backgroundColor: getFounderTypeColor(profile.founderType) }]}>
              <Text style={styles.founderTypeText}>{profile.founderType}</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.completedCommitments}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.currentStreak}</Text>
            <Text style={statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.longestStreak}</Text>
            <Text style={statLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Social Stats */}
        <View style={styles.socialStats}>
          <View style={styles.socialStat}>
            <Text style={styles.socialNumber}>{profile.followers}</Text>
            <Text style={styles.socialLabel}>Followers</Text>
          </View>
          <View style={styles.socialStat}>
            <Text style={styles.socialNumber}>{profile.following}</Text>
            <Text style={socialLabel}>Following</Text>
          </View>
          <View style={styles.socialStat}>
            <Text style={styles.socialNumber}>{formatJoinDate(profile.joinedAt)}</Text>
            <Text style={styles.socialLabel}>Joined</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followButtonFollowing]}
            onPress={handleFollow}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFollowing]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageButtonLarge} onPress={handleMessage}>
            <Ionicons name="mail-outline" size={16} color="#ffffff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Completed commitment</Text>
              <Text style={styles.activityDescription}>"Launch MVP" - 2 days ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="flame" size={16} color="#f59e0b" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>7-day streak achieved</Text>
              <Text style={styles.activityDescription}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  messageButton: {
    padding: 8,
  },
  optionsButton: {
    padding: 8,
  },
  profileHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  founderTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  founderTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  bioContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bio: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  socialStats: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  socialStat: {
    flex: 1,
    alignItems: 'center',
  },
  socialNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  socialLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  followButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    backgroundColor: '#ffffff',
  },
  followButtonFollowing: {
    backgroundColor: '#6366f1',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    textAlign: 'center',
  },
  followButtonTextFollowing: {
    color: '#ffffff',
  },
  messageButtonLarge: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
});