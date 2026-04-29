import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '../hooks/useHaptics';
import * as Sentry from '@sentry/react-native';

export default function ReassessmentScreen({ navigation }: { navigation: any }) {
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { selection } = useHaptics();

  useEffect(() => {
    loadOriginalProfile();
  }, []);

  const loadOriginalProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('foundertype_latest_profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setOriginalProfile(profile);
      }
    } catch (error) {
      console.error('Error loading original profile:', error);
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeAssessment = () => {
    selection();
    // Clear any existing progress to start fresh
    AsyncStorage.removeItem('foundertype_progress');
    AsyncStorage.removeItem('foundertype_last_session');
    
    // Navigate to questions
    navigation.navigate('questions');
  };

  const handleSkip = () => {
    navigation.navigate('landing');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.navigate('landing')} style={styles.backButton}>
          <Text style={styles.backText}>×</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.header}>30 Days Later</Text>
          <Text style={styles.subtext}>
            Your situation may have changed. Let's see how you've grown.
          </Text>
        </View>

        {originalProfile && (
          <View style={styles.originalProfileContainer}>
            <Text style={styles.originalProfileLabel}>Your Original FounderType</Text>
            <View style={styles.originalProfileCard}>
              <Text style={styles.originalFounderType}>{originalProfile.founderType}</Text>
              <Text style={styles.originalSummary} numberOfLines={3}>
                {originalProfile.summary}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.retakeButton} 
            onPress={handleRetakeAssessment}
          >
            <Text style={styles.retakeButtonText}>Retake Assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
  headerContainer: {
    marginBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 18,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
  },
  originalProfileContainer: {
    marginBottom: 40,
  },
  originalProfileLabel: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
  },
  originalProfileCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    opacity: 0.7,
  },
  originalFounderType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  originalSummary: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaContainer: {
    marginTop: 20,
  },
  retakeButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '600',
  },
});
