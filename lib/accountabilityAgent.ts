import { Commitment } from '../types/commitment';

export type AccountabilityAgentMode =
  | 'empty'
  | 'checked_in'
  | 'behind'
  | 'deadline'
  | 'normal';

export interface AccountabilityAgentState {
  mode: AccountabilityAgentMode;
  founderType: string;
  title: string;
  message: string;
  prompt: string;
  receiptLabel: string;
  missedDays: number;
}

const patternWarnings: Record<string, string> = {
  'The Sprint Starter':
    'Your pattern is losing steam when the first rush fades.',
  'The 30-Day Executor':
    'Your pattern is letting deadlines slide when nobody is watching.',
  'The Patient Builder':
    'Your pattern is hiding inside long timelines instead of visible proof.',
  'The Perfectionist':
    'Your pattern is calling delay “quality” when it is really avoidance.',
  'The Reluctant Creator':
    'Your pattern is staying private so the work cannot be judged.',
  'The Unmonetized Maker':
    'Your pattern is building without asking the market to respond.',
  Founder:
    'Your pattern is only useful if you look at it while it is happening.',
};

function getFounderPattern(founderType: string) {
  return patternWarnings[founderType] || patternWarnings.Founder;
}

function getMissedDays(commitment: Commitment | null, daysSinceStart: number) {
  if (!commitment) return 0;
  const completed =
    commitment.check_ins?.length || commitment.days_completed || 0;
  return Math.max(0, daysSinceStart - completed);
}

export function buildAccountabilityAgentState({
  commitment,
  todayAlreadyCheckedIn,
  daysSinceStart,
  isDeadlinePassed,
}: {
  commitment: Commitment | null;
  todayAlreadyCheckedIn: boolean;
  daysSinceStart: number;
  isDeadlinePassed: boolean;
}): AccountabilityAgentState {
  if (!commitment) {
    return {
      mode: 'empty',
      founderType: 'Founder',
      title: 'No commitment on record',
      message:
        'FounderType cannot hold you accountable to a thought. It needs one public commitment.',
      prompt: 'Put one specific 30-day outcome on record first.',
      receiptLabel: 'Waiting for record',
      missedDays: 0,
    };
  }

  const founderType = commitment.founder_type || 'Founder';
  const missedDays = getMissedDays(commitment, daysSinceStart);
  const pattern = getFounderPattern(founderType);

  if (isDeadlinePassed || daysSinceStart >= 30) {
    return {
      mode: 'deadline',
      founderType,
      title: 'The record needs an answer',
      message: `${pattern} Your 30 days are up. Do not leave this ambiguous.`,
      prompt:
        'Did you complete the commitment, or are you marking the loop honestly?',
      receiptLabel: 'Choose complete or abandoned',
      missedDays,
    };
  }

  if (todayAlreadyCheckedIn) {
    return {
      mode: 'checked_in',
      founderType,
      title: 'Receipt logged',
      message:
        'Good. Today is not a private intention anymore. It is part of the record.',
      prompt:
        'Before you leave, name the proof you created today so tomorrow cannot become vague.',
      receiptLabel: 'Proof over mood',
      missedDays,
    };
  }

  if (missedDays >= 2) {
    return {
      mode: 'behind',
      founderType,
      title: 'You are drifting',
      message: `${pattern} You are ${missedDays} days behind the public record you created.`,
      prompt:
        'Do the smallest verifiable version today, then check in. If you will not, say that clearly.',
      receiptLabel: `${missedDays} days behind`,
      missedDays,
    };
  }

  return {
    mode: 'normal',
    founderType,
    title: 'Accountability check',
    message: pattern,
    prompt:
      'What is the visible proof that today moved this commitment forward?',
    receiptLabel: 'Waiting for proof',
    missedDays,
  };
}
