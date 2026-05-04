import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CommitmentData {
  title: string;
  description: string;
  category: string;
  duration: number;
  progress: number;
  streak: number;
  founderName: string;
  founderType: string;
  startDate: string;
  daysCompleted: number;
}

interface ShareableCommitmentCardProps {
  commitment: CommitmentData;
  onShare?: (success: boolean) => void;
}

export default function ShareableCommitmentCard({ 
  commitment, 
  onShare 
}: ShareableCommitmentCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<View>(null);

  const generateShareableImage = async () => {
    try {
      setIsSharing(true);
      
      if (Platform.OS === 'web') {
        // For web, use the web sharing API
        await shareWebContent();
      } else {
        // For mobile, capture the card as an image
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 0.8,
        });
        await shareImage(uri);
      }
      
      onShare?.(true);
    } catch (error) {
      console.error('Failed to share commitment:', error);
      onShare?.(false);
    } finally {
      setIsSharing(false);
    }
  };

  const shareWebContent = async () => {
    const shareText = generateShareText();
    
    if (navigator.share) {
      await navigator.share({
        title: `${commitment.founderName}'s Commitment`,
        text: shareText,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      alert('Commitment details copied to clipboard!');
    }
  };

  const shareImage = async (imageUri: string) => {
    const shareText = generateShareText();
    
    await Share.share({
      message: shareText,
      url: Platform.OS === 'ios' ? imageUri : `file://${imageUri}`,
      title: `${commitment.founderName}'s Commitment`,
    });
  };

  const generateShareText = () => {
    const progressPercent = Math.round((commitment.progress / 100) * 100);
    return `🚀 ${commitment.founderName} is crushing their ${commitment.duration}-day commitment: "${commitment.title}"\n\n` +
      `📊 Progress: ${progressPercent}% complete\n` +
      `🔥 Streak: ${commitment.streak} days\n` +
      `💪 Founder Type: ${commitment.founderType}\n\n` +
      `Join FounderType and build consistency with public accountability! 🎯\n` +
      `https://foundertype.app`;
  };

  const getCategoryColor = () => {
    const colors = {
      'Health & Fitness': '#10b981',
      'Business': '#6366f1',
      'Learning': '#8b5cf6',
      'Creative': '#f59e0b',
      'Personal Growth': '#ef4444',
    };
    return colors[commitment.category as keyof typeof colors] || '#6b7280';
  };

  const getStreakEmoji = () => {
    if (commitment.streak >= 30) return '🔥🔥🔥';
    if (commitment.streak >= 14) return '🔥🔥';
    if (commitment.streak >= 7) return '🔥';
    if (commitment.streak >= 3) return '⚡';
    return '💪';
  };

  return (
    <View style={styles.container}>
      <View ref={cardRef} style={styles.card}>
        <LinearGradient
          colors={['#6366f1', getCategoryColor()]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{commitment.category}</Text>
            </View>
            <Text style={styles.duration}>{commitment.duration} Days</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.title}>{commitment.title}</Text>
          <Text style={styles.description}>{commitment.description}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercent}>
                {Math.round((commitment.progress / 100) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.round((commitment.progress / 100) * 100)}%`,
                    backgroundColor: getCategoryColor(),
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>{getStreakEmoji()}</Text>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={styles.statValue}>{commitment.streak} days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>{commitment.daysCompleted} days</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.founderInfo}>
              <Text style={styles.founderName}>{commitment.founderName}</Text>
              <Text style={styles.founderType}>{commitment.founderType}</Text>
            </View>
            <View style={styles.branding}>
              <Text style={styles.brandText}>FounderType</Text>
              <Text style={styles.brandTag}>Public Accountability</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
        onPress={generateShareableImage}
        disabled={isSharing}
      >
        <Ionicons 
          name={isSharing ? "hourglass-outline" : "share-outline"} 
          size={20} 
          color="white" 
        />
        <Text style={styles.shareButtonText}>
          {isSharing ? 'Generating...' : 'Share Progress'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: 350,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  duration: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  founderInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  founderType: {
    fontSize: 12,
    color: '#6b7280',
  },
  branding: {
    alignItems: 'flex-end',
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  brandTag: {
    fontSize: 10,
    color: '#9ca3af',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  shareButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});