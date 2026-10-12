import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo } from 'react';
import { saveProfile, getCurrentUserId } from '../lib/storage';

// Web polyfill for AsyncStorage
const webAsyncStorage =
  Platform.OS === 'web'
    ? {
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
        },
      }
    : require('@react-native-async-storage/async-storage').default;

export default function ResultsScreen({
  route,
  navigation,
  currentProfile,
  currentAnswers,
}: {
  route: any;
  navigation: any;
  currentProfile: any;
  currentAnswers: any;
}) {
  // Use props from App state, fall back to route params for backward compatibility
  const profile = currentProfile || route?.params?.profile;
  const answers = currentAnswers || route?.params?.answers;

  const founderTypeData = useMemo(() => {
    if (profile) {
      if (typeof profile === 'string') {
        try {
          return JSON.parse(profile);
        } catch {
          return null;
        }
      } else {
        return profile;
      }
    }
    return null;
  }, [profile]);

  useEffect(() => {
    if (founderTypeData) {
      // Store the latest profile for commitment posting context.
      const saveProfileData = async () => {
        if (answers && founderTypeData) {
          let parsedAnswers = {};
          try {
            parsedAnswers =
              typeof answers === 'string'
                ? answers === 'undefined'
                  ? {}
                  : JSON.parse(answers)
                : answers;
          } catch (e) {
            console.error('Error parsing answers:', e);
          }
          const userId = await getCurrentUserId();
          if (userId) {
            await saveProfile(userId, parsedAnswers, founderTypeData);

            // Store founderType for weekly insights
            await webAsyncStorage.setItem(
              'foundertype_founder_type',
              founderTypeData.founderType || ''
            );
          }
        }
      };

      void saveProfileData().catch(() =>
        console.warn('Profile could not be saved.')
      );
    }
  }, [founderTypeData]);

  const handleCommitmentPress = () => {
    navigation.navigate('commitment', {
      profile: JSON.stringify(founderTypeData),
      answers: answers,
    });
  };

  if (!founderTypeData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No profile data available</Text>
      </View>
    );
  }

  const { headline, truth, fits, quits, nextMove } = founderTypeData;

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
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
            <Text key={index} style={styles.bulletItem}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will make you quit</Text>
          {quits.map((item: string, index: number) => (
            <Text key={index} style={styles.bulletItem}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your next move</Text>
          <Text style={styles.nextMoveText}>{nextMove}</Text>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleCommitmentPress}
        >
          <Text style={styles.ctaButtonText}>Put My Commitment on Record</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('landing')}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  contentContainer: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 24,
    paddingTop: 16,
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
