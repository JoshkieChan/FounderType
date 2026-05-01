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

export default function LockoutScreen({ navigation }: { navigation: any }) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [abandonedCommitment, setAbandonedCommitment] = useState<string>('');
  const [abandonedDate, setAbandonedDate] = useState<string>('');

  useEffect(() => {
    (async () => {
      const until = await AsyncStorage.getItem('foundertype_lockout_until');
      const commitment = await AsyncStorage.getItem('foundertype_abandoned_commitment_text');
      const date = await AsyncStorage.getItem('foundertype_abandoned_date');

      if (commitment) setAbandonedCommitment(commitment);
      if (date) setAbandonedDate(date);

      if (until) {
        const lockoutEnd = new Date(until);
        const now = new Date();
        const diff = Math.ceil((lockoutEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, diff));
      } else {
        setDaysRemaining(90);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>✕</Text>
        </View>

        <Text style={styles.headline}>You Abandoned Your Commitment.</Text>

        <View style={styles.divider} />

        {abandonedCommitment ? (
          <View style={styles.abandonedCard}>
            <View style={styles.abandonedBadge}>
              <Text style={styles.abandonedBadgeText}>ABANDONED</Text>
            </View>
            <Text style={styles.abandonedText}>"{abandonedCommitment}"</Text>
            {abandonedDate ? (
              <Text style={styles.abandonedDate}>Abandoned on {new Date(abandonedDate).toLocaleDateString()}</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.body}>
          Your abandoned commitment is permanently visible in the public feed.{' '}
          <Text style={styles.red}>There is no delete button.</Text>
        </Text>

        <View style={styles.lockoutCard}>
          <Text style={styles.lockoutLabel}>LOCKOUT PERIOD</Text>
          <Text style={styles.lockoutNumber}>{daysRemaining}</Text>
          <Text style={styles.lockoutUnit}>days remaining</Text>
          <Text style={styles.lockoutSub}>
            You can post a new commitment when the lockout expires.
          </Text>
        </View>

        <Text style={styles.body}>
          If you had paid $29 for that commitment, the money would be gone forever.{' '}
          Your first commitment was free. The next one won't be.
        </Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('landing')}
        >
          <Text style={styles.ctaText}>Back to Home</Text>
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
    backgroundColor: '#EF4444',
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
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#333333',
    marginBottom: 24,
  },
  abandonedCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A0A0A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  abandonedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 12,
  },
  abandonedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  abandonedText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  abandonedDate: {
    color: '#888888',
    fontSize: 12,
    marginTop: 10,
  },
  body: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 400,
  },
  red: {
    color: '#EF4444',
    fontWeight: '600',
  },
  lockoutCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 28,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  lockoutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 2,
    marginBottom: 12,
  },
  lockoutNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockoutUnit: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 12,
  },
  lockoutSub: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
  cta: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
