import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AccountabilityReceipt } from '../lib/accountabilityReceipts';

interface WeeklyReceiptCardProps {
  receipt: AccountabilityReceipt | null;
  isDue: boolean;
  disabled?: boolean;
  onLogReceipt: () => void;
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
  isDue,
  disabled,
  onLogReceipt,
}: WeeklyReceiptCardProps) {
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
});
