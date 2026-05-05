import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AccountabilityAgentState,
  buildAccountabilityAgentState,
} from '../lib/accountabilityAgent';
import { Commitment } from '../types/commitment';

interface AccountabilityAgentCardProps {
  commitment: Commitment | null;
  todayAlreadyCheckedIn: boolean;
  daysSinceStart: number;
  isDeadlinePassed: boolean;
}

const modeStyles: Record<
  AccountabilityAgentState['mode'],
  { borderColor: string; badgeColor: string; surface: string }
> = {
  empty: {
    borderColor: '#333333',
    badgeColor: '#888888',
    surface: '#111111',
  },
  checked_in: {
    borderColor: '#14532D',
    badgeColor: '#22C55E',
    surface: '#07130B',
  },
  behind: {
    borderColor: '#7F1D1D',
    badgeColor: '#EF4444',
    surface: '#180909',
  },
  deadline: {
    borderColor: '#92400E',
    badgeColor: '#F59E0B',
    surface: '#171006',
  },
  normal: {
    borderColor: '#1E3A5F',
    badgeColor: '#3B82F6',
    surface: '#0B1220',
  },
};

export default function AccountabilityAgentCard({
  commitment,
  todayAlreadyCheckedIn,
  daysSinceStart,
  isDeadlinePassed,
}: AccountabilityAgentCardProps) {
  const state = buildAccountabilityAgentState({
    commitment,
    todayAlreadyCheckedIn,
    daysSinceStart,
    isDeadlinePassed,
  });
  const visual = modeStyles[state.mode];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: visual.surface,
          borderColor: visual.borderColor,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>ACCOUNTABILITY AGENT</Text>
        <View style={[styles.badge, { borderColor: visual.badgeColor }]}>
          <Text style={[styles.badgeText, { color: visual.badgeColor }]}>
            {state.receiptLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>{state.title}</Text>
      <Text style={styles.message}>{state.message}</Text>

      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>Mirror</Text>
        <Text style={styles.promptText}>{state.prompt}</Text>
      </View>

      <Text style={styles.footerText}>
        {state.founderType} accountability is not motivation. It is proof,
        checked daily.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  kicker: {
    color: '#7AA2F7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  promptBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  promptLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  footerText: {
    color: '#8A8A8A',
    fontSize: 12,
    lineHeight: 18,
  },
});
