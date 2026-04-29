import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface MilestoneModalProps {
  visible: boolean;
  onClose: () => void;
  icon: string;
  headline: string;
  subtext: string;
  milestoneId: string;
  showShareButton?: boolean;
}

interface ParticleProps {
  index: number;
}

const Particle: React.FC<ParticleProps> = ({ index }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const angle = (index * 360) / 20; // 20 particles distributed in a circle
  const radius = 150;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, index * 50); // Stagger particle animations

    return () => clearTimeout(timer);
  }, [index]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos((angle * Math.PI) / 180) * radius],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin((angle * Math.PI) / 180) * radius],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX }, { translateY }],
          opacity,
        },
      ]}
    />
  );
};

export default function MilestoneModal({
  visible,
  onClose,
  icon,
  headline,
  subtext,
  milestoneId,
  showShareButton = false,
}: MilestoneModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleContinue = async () => {
    // Mark this milestone as shown
    try {
      const milestones = await AsyncStorage.getItem('foundertype_milestones');
      const milestoneData = milestones ? JSON.parse(milestones) : {};
      milestoneData[milestoneId] = true;
      await AsyncStorage.setItem('foundertype_milestones', JSON.stringify(milestoneData));
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
    
    onClose();
  };

  const handleShare = async () => {
    try {
      // Create a simple shareable text for now
      const shareText = `I just completed a major milestone on my FounderType journey! ${headline}`;
      
      // For a real implementation, you could generate an image here
      await Sharing.shareAsync(shareText, {
        dialogTitle: 'Share your achievement',
      });
    } catch (error) {
      console.error('Error sharing milestone:', error);
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modal, { transform: [{ scale: scaleAnim }] }]}>
          {/* Particle Animation */}
          <View style={styles.particleContainer}>
            {[...Array(20)].map((_, index) => (
              <Particle key={index} index={index} />
            ))}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.subtext}>{subtext}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showShareButton && (
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share your achievement</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#0A0A0A',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  particleContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    width: 6,
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
