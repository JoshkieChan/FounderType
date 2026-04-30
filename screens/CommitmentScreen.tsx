import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getCurrentUserId } from '../lib/storage';

const MAX_CHARS = 140;

const EXAMPLES = [
  'I will get my first paying customer by [date]',
  'I will launch a working prototype by [date]',
  'I will have 10 conversations with real potential customers by [date]',
];

function get30DaysFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

function formatDeadline(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CommitmentScreen({ navigation, route }: { navigation: any; route: any }) {
  const profile = route?.params?.profile;
  const founderType: string = (() => {
    try {
      if (!profile) return 'Founder';
      const parsed = typeof profile === 'string' ? JSON.parse(profile) : profile;
      return parsed.founderType || parsed.founder_type || 'Founder';
    } catch {
      return 'Founder';
    }
  })();

  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const deadline = get30DaysFromNow();

  const isValid = text.trim().length > 0 && text.trim().toLowerCase() !== 'i will';

  // Public path only — saves to Supabase with auth
  const saveAndNavigate = async () => {
    if (!isValid) {
      Alert.alert('Write your commitment', 'Tell us what you will do in the next 30 days.');
      return;
    }

    setSaving(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert('Error', 'Could not identify your account. Please try again.');
        setSaving(false);
        return;
      }

      const commitmentData = {
        user_id: userId,
        founder_type: founderType,
        commitment_text: text.trim(),
        deadline: deadline.toISOString(),
        status: 'active',
        is_public: true,
        check_ins: [],
        completed: false,
        abandoned: false,
      };

      console.log('Saving commitment with founderType:', founderType);

      const { data, error } = await supabase
        .from('commitments')
        .insert(commitmentData)
        .select()
        .single();

      if (error) {
        console.error('Error saving commitment:', error);
        // Still navigate even if save fails
      }

      navigation.navigate('upgrade', {
        profile: route?.params?.profile,
        answers: route?.params?.answers,
        commitment: data || commitmentData,
        commitmentText: text.trim(),
        isPublicCommitment: true,
      });
    } catch (err) {
      console.error('Commitment save error:', err);
      navigation.navigate('upgrade', {
        profile: route?.params?.profile,
        answers: route?.params?.answers,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMakePublic = () => {
    if (!isValid) {
      Alert.alert('One more step', "Write what you'll commit to — don't leave it blank.");
      return;
    }
    saveAndNavigate();
  };

  const handleKeepPrivate = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.toLowerCase() === 'i will') {
      Alert.alert('Add your commitment', 'Write what you will do before continuing.');
      return;
    }

    // Private path: AsyncStorage only — no Supabase, no auth check
    try {
      await AsyncStorage.setItem(
        'private_commitment',
        JSON.stringify({
          text: trimmed,
          deadline: deadline.toISOString(),
          created_at: new Date().toISOString(),
          is_public: false,
        })
      );
    } catch (err) {
      console.error('Error saving private commitment locally:', err);
      // Don't block navigation even if storage fails
    }

    navigation.navigate('upgrade', {
      profile: route?.params?.profile,
      answers: route?.params?.answers,
      commitmentText: trimmed,
      isPublicCommitment: false,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Pre-label */}
          <Text style={styles.preLabel}>BEFORE YOU CONTINUE</Text>

          {/* Headline */}
          <Text style={styles.headline}>
            Most people read their profile and do nothing.
          </Text>
          <Text style={styles.headlineAccent}>
            You're here because you're different. Prove it.
          </Text>

          {/* Subtext */}
          <Text style={styles.subtext}>
            Write one specific thing you will complete in the next 30 days. Not a goal. A declaration. Something a stranger could verify.
          </Text>

          {/* Example cards */}
          <View style={styles.examplesContainer}>
            {EXAMPLES.map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exampleCard}
                onPress={() => setText(ex.replace('[date]', formatDeadline(deadline)))}
                activeOpacity={0.7}
              >
                <Text style={styles.exampleText}>"{ex}"</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
              placeholder="I will..."
              placeholderTextColor="#555555"
              multiline
              maxLength={MAX_CHARS}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              blurOnSubmit
            />
            <Text style={[styles.charCounter, text.length >= MAX_CHARS && styles.charCounterMax]}>
              {text.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Deadline */}
          <Text style={styles.deadline}>
            Deadline: {formatDeadline(deadline)}
          </Text>

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.publicButton, (!isValid || saving) && styles.publicButtonDisabled]}
            onPress={handleMakePublic}
            disabled={!isValid || saving}
          >
            <Text style={styles.publicButtonText}>
              {saving ? 'Saving...' : 'Make It Public'}
            </Text>
          </TouchableOpacity>

          {/* Public disclaimer */}
          <Text style={styles.publicDisclaimer}>
            This will be visible to other FounderType users. No name. Just your FounderType and your word.
          </Text>

          {/* Keep private link */}
          <TouchableOpacity onPress={handleKeepPrivate} disabled={saving} style={styles.privateLink}>
            <Text style={styles.privateLinkText}>Keep it private instead</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '500',
  },
  preLabel: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  headlineAccent: {
    color: '#3B82F6',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 20,
  },
  subtext: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  examplesContainer: {
    marginBottom: 24,
    gap: 10,
  },
  exampleCard: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  exampleText: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  inputWrapper: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    padding: 16,
    marginBottom: 12,
    minHeight: 120,
  },
  inputWrapperFocused: {
    borderColor: '#3B82F6',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCounter: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  charCounterMax: {
    color: '#EF4444',
  },
  deadline: {
    color: '#666666',
    fontSize: 13,
    marginBottom: 28,
    textAlign: 'center',
  },
  publicButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  publicButtonDisabled: {
    backgroundColor: '#1E3A5F',
    shadowOpacity: 0,
    elevation: 0,
  },
  publicButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  publicDisclaimer: {
    color: '#555555',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  privateLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  privateLinkText: {
    color: '#555555',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
