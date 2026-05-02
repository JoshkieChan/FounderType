import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveProfile, getCurrentUserId } from '../lib/storage';

// Web polyfill for AsyncStorage
const webAsyncStorage = Platform.OS === 'web' ? {
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return Promise.resolve(null);
  }
} : require('@react-native-async-storage/async-storage').default;

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'results'>;

export default function ResultsScreen({ route, navigation, currentProfile, currentAnswers }: { 
  route: ResultsScreenRouteProp; 
  navigation: ResultsScreenNavigationProp;
  currentProfile: any;
  currentAnswers: any;
}) {
  // Use props from App state, fall back to route params for backward compatibility
  const profile = currentProfile || route?.params?.profile;
  const answers = currentAnswers || route?.params?.answers;

  let founderTypeData: any = null;
  if (profile) {
    if (typeof profile === 'string') {
      try {
        founderTypeData = JSON.parse(profile);
      } catch {
        founderTypeData = null;
      }
    } else {
      founderTypeData = profile;
    }
  }

  const saveProfileToSupabase = async () => {
    if (!founderTypeData) return;
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          founder_type: founderTypeData.founderType,
          profile_data: founderTypeData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving profile:', error);
      }
    } catch (err) {
      console.error('Error in saveProfileToSupabase:', err);
    }
  };

  useEffect(() => {
    if (founderTypeData) {
      saveProfileToSupabase();
      // Store the latest profile for commitment posting context.
      const saveProfileData = async () => {
        if (answers && founderTypeData) {
          let parsedAnswers = {};
          try {
            parsedAnswers = typeof answers === 'string' 
              ? (answers === 'undefined' ? {} : JSON.parse(answers)) 
              : answers;
          } catch (e) {
            console.error('Error parsing answers:', e);
          }
          const userId = await getCurrentUserId();
          if (userId) {
            await saveProfile(userId, parsedAnswers, founderTypeData);
            
            // Store founderType for weekly insights
            await webAsyncStorage.setItem('foundertype_founder_type', founderTypeData.founderType || '');
          }
        }
      };
      
      saveProfileData();
    }
  }, [founderTypeData]);

  const handleCommitmentPress = () => {
    navigation.navigate('commitment', { 
      profile: JSON.stringify(founderTypeData), 
      answers: answers 
    });
  };

  if (!founderTypeData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No profile data available</Text>
      </View>
    );
  }

  const { founderType, headline, truth, fits, quits, nextMove } = founderTypeData;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headline}>{headline}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>The Truth</Text>
        <Text style={styles.sectionText}>{truth}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What fits you</Text>
        {fits.map((item: string, index: number) => (
          <Text key={index} style={styles.bulletItem}>• {item}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What will make you quit</Text>
        {quits.map((item: string, index: number) => (
          <Text key={index} style={styles.bulletItem}>• {item}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your next move</Text>
        <Text style={styles.nextMoveText}>{nextMove}</Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={handleCommitmentPress}>
        <Text style={styles.ctaButtonText}>Post My First Commitment</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('landing')}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  bulletItem: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  nextMoveText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
