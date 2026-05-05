import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccountabilityAgentState,
  buildAccountabilityAgentState,
} from './accountabilityAgent';
import { Commitment } from '../types/commitment';

const RECEIPTS_KEY = 'foundertype_accountability_receipts';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccountabilityReceipt {
  id: string;
  commitmentId: string;
  createdAt: string;
  weekNumber: number;
  founderType: string;
  commitmentText: string;
  dailyAction: string | null;
  agentMode: AccountabilityAgentState['mode'];
  title: string;
  mirror: string;
  prompt: string;
  missedDays: number;
  checkedInToday: boolean;
  daysSinceStart: number;
}

export async function getAccountabilityReceipts(
  commitmentId?: string
): Promise<AccountabilityReceipt[]> {
  try {
    const stored = await AsyncStorage.getItem(RECEIPTS_KEY);
    const receipts: AccountabilityReceipt[] = stored ? JSON.parse(stored) : [];

    if (!commitmentId) return receipts;
    return receipts.filter((receipt) => receipt.commitmentId === commitmentId);
  } catch {
    return [];
  }
}

export async function getLatestAccountabilityReceipt(
  commitmentId?: string
): Promise<AccountabilityReceipt | null> {
  const receipts = await getAccountabilityReceipts(commitmentId);
  return receipts[0] || null;
}

export function isWeeklyReceiptDue(receipt: AccountabilityReceipt | null) {
  if (!receipt) return true;
  return Date.now() - new Date(receipt.createdAt).getTime() >= WEEK_MS;
}

export function buildWeeklyAccountabilityReceipt({
  commitment,
  todayAlreadyCheckedIn,
  daysSinceStart,
  isDeadlinePassed,
}: {
  commitment: Commitment;
  todayAlreadyCheckedIn: boolean;
  daysSinceStart: number;
  isDeadlinePassed: boolean;
}): AccountabilityReceipt {
  const agentState = buildAccountabilityAgentState({
    commitment,
    todayAlreadyCheckedIn,
    daysSinceStart,
    isDeadlinePassed,
  });
  const weekNumber = Math.max(1, Math.ceil((daysSinceStart + 1) / 7));

  return {
    id: `${commitment.id}-${Date.now()}`,
    commitmentId: commitment.id,
    createdAt: new Date().toISOString(),
    weekNumber,
    founderType: agentState.founderType,
    commitmentText: commitment.commitment_text,
    dailyAction: commitment.daily_action,
    agentMode: agentState.mode,
    title: agentState.title,
    mirror: agentState.message,
    prompt: agentState.prompt,
    missedDays: agentState.missedDays,
    checkedInToday: todayAlreadyCheckedIn,
    daysSinceStart,
  };
}

export async function saveAccountabilityReceipt(
  receipt: AccountabilityReceipt
) {
  const receipts = await getAccountabilityReceipts();
  const nextReceipts = [
    receipt,
    ...receipts.filter((existing) => existing.id !== receipt.id),
  ].slice(0, 24);

  await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(nextReceipts));
  return receipt;
}
