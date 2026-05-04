import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StreakSystem } from '../lib/streakSystem';

interface StreakBadgeProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
  showEmoji?: boolean;
  showProgress?: boolean;
}

export default function StreakBadge({ 
  streak, 
  size = 'medium', 
  showEmoji = true, 
  showProgress = false 
}: StreakBadgeProps) {
  const emoji = StreakSystem.getStreakEmoji(streak);
  const color = StreakSystem.getStreakColor(streak);
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 24 },
          emoji: { fontSize: 12 },
          text: { fontSize: 10 },
        };
      case 'large':
        return {
          container: { width: 120, height: 48 },
          emoji: { fontSize: 24 },
          text: { fontSize: 16 },
        };
      default: // medium
        return {
          container: { width: 90, height: 36 },
          emoji: { fontSize: 18 },
          text: { fontSize: 14 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container, { borderColor: color }]}>
      {showEmoji && (
        <Text style={[styles.emoji, sizeStyles.emoji]}>{emoji}</Text>
      )}
      <Text style={[styles.text, sizeStyles.text, { color }]}>
        {streak} day{streak !== 1 ? 's' : ''}
      </Text>
      {showProgress && streak > 0 && (
        <View style={[styles.progressIndicator, { backgroundColor: color }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 8,
    position: 'relative',
  },
  emoji: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});