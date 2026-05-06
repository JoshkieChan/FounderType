import {
  buildAccountabilityVoiceScript,
  buildReceiptVoiceScript,
} from '../../lib/accountabilityVoice';
import { AccountabilityAgentState } from '../../lib/accountabilityAgent';
import { AccountabilityReceipt } from '../../lib/accountabilityReceipts';

const agentState: AccountabilityAgentState = {
  mode: 'behind',
  founderType: 'The 30-Day Executor',
  title: 'You are drifting',
  message: 'Your pattern is letting deadlines slide when nobody is watching.',
  prompt: 'Do the smallest verifiable version today, then check in.',
  receiptLabel: '2 days behind',
  missedDays: 2,
};

const receipt: AccountabilityReceipt = {
  id: 'receipt-1',
  commitmentId: 'commitment-1',
  createdAt: '2026-05-05T00:00:00.000Z',
  weekNumber: 2,
  founderType: 'The 30-Day Executor',
  commitmentText: 'Get my first paying customer',
  dailyAction: 'Send three direct offers',
  agentMode: 'behind',
  title: 'You are drifting',
  mirror: 'Your pattern is letting deadlines slide when nobody is watching.',
  prompt: 'Do the smallest verifiable version today, then check in.',
  missedDays: 2,
  checkedInToday: false,
  daysSinceStart: 8,
};

describe('accountability voice scripts', () => {
  it('builds a firm provider-neutral agent script', () => {
    const script = buildAccountabilityVoiceScript(agentState);

    expect(script.spokenText).toContain('You are drifting');
    expect(script.spokenText).toContain('not here to motivate you');
    expect(script.providerMetadata).toEqual({ tone: 'firm', maxSeconds: 35 });
  });

  it('builds a weekly receipt voice script', () => {
    const script = buildReceiptVoiceScript(receipt);

    expect(script.title).toContain('Week 2');
    expect(script.spokenText).toContain('2 days behind');
    expect(script.providerMetadata.tone).toBe('receipt');
  });
});
