import type { AccountabilityAgentState } from './accountabilityAgent';
import type { AccountabilityReceipt } from './accountabilityReceipts';

export interface AccountabilityVoiceScript {
  title: string;
  spokenText: string;
  providerMetadata: {
    tone: 'direct' | 'firm' | 'receipt';
    maxSeconds: number;
  };
}

const MAX_SPOKEN_CHARS = 520;

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function trimForSpeech(value: string) {
  const normalized = compactWhitespace(value);
  if (normalized.length <= MAX_SPOKEN_CHARS) return normalized;
  return `${normalized.slice(0, MAX_SPOKEN_CHARS - 3).trim()}...`;
}

export function buildAccountabilityVoiceScript(
  state: AccountabilityAgentState
): AccountabilityVoiceScript {
  const spokenText = trimForSpeech(
    [
      state.title,
      state.message,
      state.prompt,
      'FounderType is not here to motivate you. It is here to keep the record honest.',
    ].join(' ')
  );

  return {
    title: state.title,
    spokenText,
    providerMetadata: {
      tone: state.mode === 'checked_in' ? 'receipt' : 'firm',
      maxSeconds: 35,
    },
  };
}

export function buildReceiptVoiceScript(
  receipt: AccountabilityReceipt
): AccountabilityVoiceScript {
  const status =
    receipt.missedDays > 0
      ? `You are ${receipt.missedDays} day${receipt.missedDays === 1 ? '' : 's'} behind.`
      : 'You are current with the record.';
  const spokenText = trimForSpeech(
    [
      `Week ${receipt.weekNumber}. ${receipt.title}.`,
      receipt.mirror,
      receipt.prompt,
      status,
    ].join(' ')
  );

  return {
    title: `Week ${receipt.weekNumber}: ${receipt.title}`,
    spokenText,
    providerMetadata: {
      tone: 'receipt',
      maxSeconds: 40,
    },
  };
}
