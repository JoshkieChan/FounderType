import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AccountabilityReceipt } from '../lib/accountabilityReceipts';

interface WeeklyReceiptCardProps {
  receipt: AccountabilityReceipt | null;
  receipts: AccountabilityReceipt[];
  isDue: boolean;
  disabled?: boolean;
  email: string;
  emailStatus?: string | null;
  isSendingEmail?: boolean;
  onLogReceipt: () => void;
  onEmailChange: (email: string) => void;
  onSendEmail: () => void;
}

function formatReceiptDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WeeklyReceiptCard({
  receipt,
  receipts,
  isDue,
  disabled,
  email,
  emailStatus,
  isSendingEmail,
  onLogReceipt,
  onEmailChange,
  onSendEmail,
}: WeeklyReceiptCardProps) {
  const history = receipts.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>WEEKLY RECEIPT</Text>
        <Text style={[styles.status, isDue ? styles.statusDue : null]}>
          {isDue ? 'Due' : 'Logged'}
        </Text>
      </View>

      {receipt ? (
        <View style={styles.receiptBody}>
          <Text style={styles.title}>
            Week {receipt.weekNumber} · {formatReceiptDate(receipt.createdAt)}
          </Text>
          <Text style={styles.mirror}>{receipt.mirror}</Text>
          <Text style={styles.detail}>
            Missed days: {receipt.missedDays} · Today:{' '}
            {receipt.checkedInToday ? 'checked in' : 'not checked in'}
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          No weekly receipt yet. Log one when you want FounderType to preserve a
          snapshot of the pattern, not just the streak.
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          (!isDue || disabled) && styles.buttonSecondary,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onLogReceipt}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {receipt && !isDue ? 'Update Receipt Anyway' : 'Log Weekly Receipt'}
        </Text>
      </TouchableOpacity>

      {receipt && (
        <View style={styles.emailSection}>
          <Text style={styles.sectionTitle}>Send this receipt</Text>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={onEmailChange}
            placeholder="you@example.com"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={[
              styles.emailButton,
              (!email || isSendingEmail) && styles.buttonDisabled,
            ]}
            onPress={onSendEmail}
            disabled={!email || isSendingEmail}
          >
            <Text style={styles.emailButtonText}>
              {isSendingEmail ? 'Sending...' : 'Email Receipt'}
            </Text>
          </TouchableOpacity>
          {emailStatus && <Text style={styles.emailStatus}>{emailStatus}</Text>}
        </View>
      )}

      {history.length > 1 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent receipts</Text>
          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyTitle}>
                Week {item.weekNumber} · {formatReceiptDate(item.createdAt)}
              </Text>
              <Text style={styles.historyText} numberOfLines={2}>
                {item.prompt}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#101010',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kicker: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  status: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  statusDue: {
    color: '#F59E0B',
  },
  receiptBody: {
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  mirror: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  detail: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    color: '#BDBDBD',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#1E3A5F',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emailSection: {
    borderTopWidth: 1,
    borderTopColor: '#242424',
    marginTop: 16,
    paddingTop: 16,
    gap: 10,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emailInput: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emailButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '800',
  },
  emailStatus: {
    color: '#BDBDBD',
    fontSize: 12,
    lineHeight: 18,
  },
  historySection: {
    borderTopWidth: 1,
    borderTopColor: '#242424',
    marginTop: 16,
    paddingTop: 16,
    gap: 10,
  },
  historyItem: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 12,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  historyText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
  },
});
