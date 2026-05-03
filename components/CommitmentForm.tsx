import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

interface CommitmentFormProps {
  onSubmit: (commitment: string, dailyAction: string, deadline: string) => void;
  initialCommitment?: string;
  initialDailyAction?: string;
  initialDeadline?: string;
  isEditMode?: boolean;
}

const MAX_CHARS = 140;
const MAX_DAILY_ACTION_CHARS = 60;

const EXAMPLES = [
  'I will get my first paying customer by May 30, 2026',
  'I will launch a working prototype by May 30, 2026',
  'I will have 10 conversations with real potential customers by May 30, 2026',
];

function get30DaysFromNow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export default function CommitmentForm({
  onSubmit,
  initialCommitment = '',
  initialDailyAction = '',
  initialDeadline = '',
  isEditMode = false,
}: CommitmentFormProps) {
  const [commitment, setCommitment] = useState(initialCommitment);
  const [dailyAction, setDailyAction] = useState(initialDailyAction);
  const [deadline, setDeadline] = useState(initialDeadline);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!commitment.trim()) {
      Alert.alert('Missing commitment', 'Please enter your commitment');
      return;
    }

    if (!dailyAction.trim()) {
      Alert.alert('Missing daily action', 'Please enter your daily action');
      return;
    }

    if (!deadline.trim()) {
      Alert.alert('Missing deadline', 'Please enter a deadline');
      return;
    }

    onSubmit(commitment.trim(), dailyAction.trim(), deadline.trim());
  };

  const handleRandomExample = () => {
    const random = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setCommitment(random);
    setDeadline(get30DaysFromNow().toISOString().split('T')[0]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>My commitment (max {MAX_CHARS} chars)</Text>
        <TextInput
          style={styles.textInput}
          value={commitment}
          onChangeText={setCommitment}
          placeholder="I will..."
          multiline
          maxLength={MAX_CHARS}
        />
        <Text style={styles.charCount}>
          {commitment.length}/{MAX_CHARS}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>
          Daily action (max {MAX_DAILY_ACTION_CHARS} chars)
        </Text>
        <TextInput
          style={styles.textInput}
          value={dailyAction}
          onChangeText={setDailyAction}
          placeholder="Every day I will..."
          maxLength={MAX_DAILY_ACTION_CHARS}
        />
        <Text style={styles.charCount}>
          {dailyAction.length}/{MAX_DAILY_ACTION_CHARS}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Deadline</Text>
        <TextInput
          style={styles.textInput}
          value={deadline}
          onChangeText={setDeadline}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {!isEditMode && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.exampleButton}
            onPress={handleRandomExample}
          >
            <Text style={styles.exampleButtonText}>🎲 Random Example</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          {isEditMode ? 'Update Commitment' : 'Make Commitment'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  exampleButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  exampleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
