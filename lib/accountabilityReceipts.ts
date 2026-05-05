import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccountabilityAgentState,
  buildAccountabilityAgentState,
} from './accountabilityAgent';
import { Commitment } from '../types/commitment';
import { supabase } from './supabase';
import { getCurrentUserId } from './storage';

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
  synced?: boolean;
}

interface AccountabilityReceiptRow {
  id: string;
  user_id: string;
  commitment_id: string;
  created_at: string;
  week_number: number;
  founder_type: string;
  commitment_text: string;
  daily_action: string | null;
  agent_mode: AccountabilityAgentState['mode'];
  title: string;
  mirror: string;
  prompt: string;
  missed_days: number;
  checked_in_today: boolean;
  days_since_start: number;
}

function fromRow(row: AccountabilityReceiptRow): AccountabilityReceipt {
  return {
    id: row.id,
    commitmentId: row.commitment_id,
    createdAt: row.created_at,
    weekNumber: row.week_number,
    founderType: row.founder_type,
    commitmentText: row.commitment_text,
    dailyAction: row.daily_action,
    agentMode: row.agent_mode,
    title: row.title,
    mirror: row.mirror,
    prompt: row.prompt,
    missedDays: row.missed_days,
    checkedInToday: row.checked_in_today,
    daysSinceStart: row.days_since_start,
    synced: true,
  };
}

function toInsert(
  receipt: AccountabilityReceipt,
  userId: string
): Omit<AccountabilityReceiptRow, 'id'> {
  return {
    user_id: userId,
    commitment_id: receipt.commitmentId,
    created_at: receipt.createdAt,
    week_number: receipt.weekNumber,
    founder_type: receipt.founderType,
    commitment_text: receipt.commitmentText,
    daily_action: receipt.dailyAction,
    agent_mode: receipt.agentMode,
    title: receipt.title,
    mirror: receipt.mirror,
    prompt: receipt.prompt,
    missed_days: receipt.missedDays,
    checked_in_today: receipt.checkedInToday,
    days_since_start: receipt.daysSinceStart,
  };
}

export async function getAccountabilityReceipts(
  commitmentId?: string
): Promise<AccountabilityReceipt[]> {
  const remoteReceipts = await getRemoteAccountabilityReceipts(commitmentId);
  if (remoteReceipts.length > 0) {
    await mergeLocalReceipts(remoteReceipts);
    return remoteReceipts;
  }

  try {
    const stored = await AsyncStorage.getItem(RECEIPTS_KEY);
    const receipts: AccountabilityReceipt[] = stored ? JSON.parse(stored) : [];

    if (!commitmentId) return receipts;
    return receipts.filter((receipt) => receipt.commitmentId === commitmentId);
  } catch {
    return [];
  }
}

async function getRemoteAccountabilityReceipts(commitmentId?: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return [];

    let query = supabase
      .from('accountability_receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(24);

    if (commitmentId && !commitmentId.startsWith('local-')) {
      query = query.eq('commitment_id', commitmentId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as AccountabilityReceiptRow[]).map(fromRow);
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
    synced: false,
  };
}

export async function saveAccountabilityReceipt(
  receipt: AccountabilityReceipt
) {
  const syncedReceipt = await syncAccountabilityReceipt(receipt);
  const receipts = await getAccountabilityReceipts();
  const nextReceipts = [
    syncedReceipt,
    ...receipts.filter((existing) => existing.id !== syncedReceipt.id),
  ].slice(0, 24);

  await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(nextReceipts));
  return syncedReceipt;
}

async function syncAccountabilityReceipt(receipt: AccountabilityReceipt) {
  try {
    if (receipt.commitmentId.startsWith('local-')) return receipt;

    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return receipt;

    const { data, error } = await supabase
      .from('accountability_receipts')
      .insert(toInsert(receipt, userId))
      .select('*')
      .maybeSingle();

    if (error || !data) return receipt;
    return fromRow(data as AccountabilityReceiptRow);
  } catch {
    return receipt;
  }
}

async function mergeLocalReceipts(receipts: AccountabilityReceipt[]) {
  try {
    const stored = await AsyncStorage.getItem(RECEIPTS_KEY);
    const localReceipts: AccountabilityReceipt[] = stored
      ? JSON.parse(stored)
      : [];
    const merged = [...receipts, ...localReceipts]
      .filter(
        (receipt, index, all) =>
          all.findIndex((candidate) => candidate.id === receipt.id) === index
      )
      .slice(0, 24);

    await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(merged));
  } catch {
    // Local cache is best-effort.
  }
}
