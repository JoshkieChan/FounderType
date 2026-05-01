import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UnlockScreen({ navigation }: { navigation: any }) {
  const [hasTakenNextLevel, setHasTakenNextLevel] = useState(false);

  useEffect(() => {
    (async () => {
      const nl = await AsyncStorage.getItem('foundertype_next_level_completed');
      setHasTakenNextLevel(!!nl);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>✓</Text>
        </View>

        <Text style={styles.headline}>You Followed Through.</Text>
        <Text style={styles.subheadline}>Ready for Real Stakes?</Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Your first commitment was free. Your next one costs{' '}
          <Text style={styles.bold}>$29</Text>—refunded as credit if you complete it,{' '}
          <Text style={styles.lost}>lost forever</Text> if you abandon it.
        </Text>

        <View style={styles.stakesCard}>
          <Text style={styles.stakesTitle}>What $29 Gets You</Text>
          <View style={styles.stakeItem}>
            <Text style={styles.stakeBullet}>•</Text>
            <Text style={styles.stakeText}>Second commitment posted to public feed</Text>
          </View>
          <View style={styles.stakeItem}>
            <Text style={styles.stakeBullet}>•</Text>
            <Text style={styles.stakeText}>30-day action plan (free companion)</Text>
          </View>
          <View style={styles.stakeItem}>
            <Text style={styles.stakeBullet}>•</Text>
            <Text style={styles.stakeText}>
              <Text style={styles.green}>Complete it → $29 refunded as credit</Text>
            </Text>
          </View>
          <View style={styles.stakeItem}>
            <Text style={styles.stakeBullet}>•</Text>
            <Text style={styles.stakeText}>
              <Text style={styles.red}>Abandon it → $29 gone forever, plus permanent red flag in feed</Text>
            </Text>
          </View>
        </View>

        {!hasTakenNextLevel && (
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => navigation.navigate('nextLevel')}
          >
            <Text style={styles.secondaryCtaText}>Take Next Level Assessment First (Free)</Text>
            <Text style={styles.secondaryCtaSub}>Understand your pattern before committing with stakes</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => {
            AsyncStorage.setItem('foundertype_paid_tier_unlocked', 'true');
            navigation.navigate('commitment');
          }}
        >
          <Text style={styles.primaryCtaText}>Post Second Commitment — $29</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => navigation.navigate('landing')}
        >
          <Text style={styles.skipText}>Not ready yet — back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: Platform.OS === 'web' ? 20 : 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeEmoji: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subheadline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#333333',
    marginBottom: 24,
  },
  body: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400,
  },
  bold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lost: {
    color: '#EF4444',
    fontWeight: '600',
  },
  stakesCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stakesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stakeItem: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  stakeBullet: {
    color: '#888888',
    fontSize: 14,
  },
  stakeText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  green: { color: '#10B981', fontWeight: '600' },
  red: { color: '#EF4444', fontWeight: '600' },
  secondaryCta: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
  },
  secondaryCtaText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryCtaSub: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  primaryCta: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  skipLink: {
    padding: 8,
  },
  skipText: {
    color: '#555555',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
