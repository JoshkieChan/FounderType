import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { loadProfile, getCurrentUserId } from '../lib/storage';
import * as Sentry from '@sentry/react-native';

export default function LandingScreen({ navigation }: { navigation: any }) {
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  useEffect(() => {
    const checkForSavedProfile = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const savedProfile = await loadProfile(userId);
          if (savedProfile) {
            setHasSavedProfile(true);
          }
        }
      } catch (error) {
        console.error('Error checking for saved profile:', error);
      }
    };

    checkForSavedProfile();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>
          Stop guessing.{'\n'}Start building{'\n'}the right thing.
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => navigation.navigate('onboarding')}
        >
          <Text style={styles.ctaText}>Discover Your FounderType</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.privacyLink}
          onPress={() => navigation.navigate('privacy')}
        >
          <Text style={styles.privacyText}>Privacy Policy</Text>
        </TouchableOpacity>

        {hasSavedProfile && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('results')}
          >
            <Text style={styles.secondaryButtonText}>View Your Last Results</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  privacyLink: {
    padding: 8,
  },
  privacyText: {
    color: '#888888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '600',
  },
});
