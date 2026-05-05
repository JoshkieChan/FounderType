import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccountabilityAgentState,
  buildAccountabilityAgentState,
} from './accountabilityAgent';
import { Commitment } from '../types/commitment';
import { supabase } from './supabase';
import { getCurrentUserId } from './storage';
import Logger from './logger';

const RECEIPTS_KEY = 'foundertype_accountability_receipts';
const RECEIPT_EMAIL_KEY = 'foundertype_accountability_email';
const RECEIPT_EMAIL_OPT_IN_KEY = 'foundertype_accountability_email_opt_in';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export interface AccountabilityMessage {
  subject: string;
  text: string;
  html: string;
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

export function buildAccountabilityMessage(
  receipt: AccountabilityReceipt
): AccountabilityMessage {
  const statusLine =
    receipt.missedDays > 0
      ? `You are ${receipt.missedDays} day${receipt.missedDays === 1 ? '' : 's'} behind the record.`
      : 'You are current with the record.';
  const proofLine = receipt.checkedInToday
    ? 'Today has a check-in attached to it.'
    : 'Today still needs visible proof.';
  const subject = `FounderType Week ${receipt.weekNumber}: ${receipt.title}`;
  const text = [
    `FounderType accountability receipt`,
    ``,
    `Week ${receipt.weekNumber}`,
    `FounderType: ${receipt.founderType}`,
    `Commitment: ${receipt.commitmentText}`,
    receipt.dailyAction ? `Daily action: ${receipt.dailyAction}` : null,
    ``,
    `Mirror: ${receipt.mirror}`,
    `Prompt: ${receipt.prompt}`,
    ``,
    statusLine,
    proofLine,
    ``,
    `This is not motivation. It is the record.`,
  ]
    .filter(Boolean)
    .join('\n');
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0a0a0a;color:#ffffff;padding:24px;">
      <p style="font-size:12px;letter-spacing:2px;color:#3b82f6;font-weight:700;">FOUNDER TYPE ACCOUNTABILITY RECEIPT</p>
      <h1 style="font-size:24px;margin:0 0 12px;">Week ${receipt.weekNumber}: ${escapeHtml(receipt.title)}</h1>
      <p style="color:#cfcfcf;line-height:1.6;"><strong>Commitment:</strong> ${escapeHtml(receipt.commitmentText)}</p>
      ${
        receipt.dailyAction
          ? `<p style="color:#cfcfcf;line-height:1.6;"><strong>Daily action:</strong> ${escapeHtml(receipt.dailyAction)}</p>`
          : ''
      }
      <div style="border:1px solid #1e3a5f;border-radius:12px;padding:16px;margin:20px 0;background:#101827;">
        <p style="color:#93c5fd;font-size:12px;font-weight:700;margin:0 0 8px;">MIRROR</p>
        <p style="line-height:1.6;margin:0 0 12px;">${escapeHtml(receipt.mirror)}</p>
        <p style="color:#ffffff;font-weight:700;line-height:1.6;margin:0;">${escapeHtml(receipt.prompt)}</p>
      </div>
      <p style="color:#cfcfcf;line-height:1.6;">${escapeHtml(statusLine)} ${escapeHtml(proofLine)}</p>
      <p style="color:#888888;font-size:13px;">This is not motivation. It is the record.</p>
    </div>
  `;

  return { subject, text, html };
}

export function isValidReceiptEmail(email: string) {
  return EMAIL_PATTERN.test(email) && email.length <= 254;
}

export async function getReceiptEmailAddress() {
  return (await AsyncStorage.getItem(RECEIPT_EMAIL_KEY)) || '';
}

export async function saveReceiptEmailAddress(email: string) {
  await AsyncStorage.setItem(RECEIPT_EMAIL_KEY, email.trim());
}

export async function getReceiptEmailOptIn() {
  return (await AsyncStorage.getItem(RECEIPT_EMAIL_OPT_IN_KEY)) === 'true';
}

export async function saveReceiptEmailOptIn(enabled: boolean) {
  await AsyncStorage.setItem(
    RECEIPT_EMAIL_OPT_IN_KEY,
    enabled ? 'true' : 'false'
  );
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

export async function sendAccountabilityReceiptEmail(
  receipt: AccountabilityReceipt,
  email: string
) {
  const normalizedEmail = email.trim();
  if (!isValidReceiptEmail(normalizedEmail)) {
    return { success: false, error: 'Enter a valid email address.' };
  }

  await saveReceiptEmailAddress(normalizedEmail);

  try {
    const message = buildAccountabilityMessage(receipt);
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: normalizedEmail,
        subject: message.subject,
        html: message.html,
        text: message.text,
      },
    });

    if (error) {
      Logger.warn('Accountability receipt email failed', {
        reason: 'edge_function_error',
      });
      return {
        success: false,
        error: 'Could not send the receipt email. Please try again.',
      };
    }

    return { success: true };
  } catch {
    Logger.warn('Accountability receipt email failed', {
      reason: 'unexpected_error',
    });
    return {
      success: false,
      error: 'Could not send the receipt email. Please try again.',
    };
  }
}

export async function maybeSendOptInReceiptEmail(
  receipt: AccountabilityReceipt,
  email: string,
  optedIn: boolean
) {
  if (!optedIn) return { skipped: true as const };
  const result = await sendAccountabilityReceiptEmail(receipt, email);
  return { skipped: false as const, ...result };
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

    if (error || !data) {
      Logger.warn('Accountability receipt remote sync skipped', {
        reason: error ? 'database_error' : 'missing_response',
      });
      return receipt;
    }
    return fromRow(data as AccountabilityReceiptRow);
  } catch {
    Logger.warn('Accountability receipt remote sync skipped', {
      reason: 'unexpected_error',
    });
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
