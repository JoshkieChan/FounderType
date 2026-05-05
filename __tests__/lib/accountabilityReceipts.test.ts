import {
  buildAccountabilityMessage,
  buildWeeklyAccountabilityReceipt,
  isValidReceiptEmail,
  isWeeklyReceiptDue,
  maybeSendOptInReceiptEmail,
} from '../../lib/accountabilityReceipts';
import { Commitment } from '../../types/commitment';

const commitment: Commitment = {
  id: 'commitment-1',
  user_id: 'user-1',
  commitment_text: 'Get my first paying customer',
  daily_action: 'Send three direct offers',
  founder_type: 'The 30-Day Executor',
  created_at: '2026-05-01T00:00:00.000Z',
  deadline: '2026-05-31T00:00:00.000Z',
  completed_at: null,
  abandoned_at: null,
  edited_at: null,
  status: 'active',
  check_ins: ['2026-05-01'],
  days_completed: 1,
  abandoned_on_day: null,
};

describe('accountability receipts', () => {
  it('builds a weekly receipt from commitment state', () => {
    const receipt = buildWeeklyAccountabilityReceipt({
      commitment,
      todayAlreadyCheckedIn: false,
      daysSinceStart: 8,
      isDeadlinePassed: false,
    });

    expect(receipt.weekNumber).toBe(2);
    expect(receipt.commitmentText).toBe(commitment.commitment_text);
    expect(receipt.missedDays).toBe(7);
  });

  it('knows when a weekly receipt is due', () => {
    expect(isWeeklyReceiptDue(null)).toBe(true);
    expect(
      isWeeklyReceiptDue({
        id: 'receipt-1',
        commitmentId: 'commitment-1',
        createdAt: new Date().toISOString(),
        weekNumber: 1,
        founderType: 'Founder',
        commitmentText: 'Ship',
        dailyAction: null,
        agentMode: 'normal',
        title: 'Accountability check',
        mirror: 'Mirror',
        prompt: 'Prompt',
        missedDays: 0,
        checkedInToday: false,
        daysSinceStart: 1,
      })
    ).toBe(false);
  });

  it('generates email-safe accountability messages', () => {
    const receipt = buildWeeklyAccountabilityReceipt({
      commitment: {
        ...commitment,
        commitment_text: 'Ship <script>alert("x")</script>',
      },
      todayAlreadyCheckedIn: true,
      daysSinceStart: 1,
      isDeadlinePassed: false,
    });
    const message = buildAccountabilityMessage(receipt);

    expect(message.subject).toContain('FounderType Week');
    expect(message.text).toContain('This is not motivation');
    expect(message.html).toContain('&lt;script&gt;');
    expect(message.html).not.toContain('<script>alert');
  });

  it('validates receipt email addresses', () => {
    expect(isValidReceiptEmail('josh@example.com')).toBe(true);
    expect(isValidReceiptEmail('not-an-email')).toBe(false);
  });

  it('skips automatic receipt emails when opt-in is disabled', async () => {
    const receipt = buildWeeklyAccountabilityReceipt({
      commitment,
      todayAlreadyCheckedIn: false,
      daysSinceStart: 8,
      isDeadlinePassed: false,
    });

    await expect(
      maybeSendOptInReceiptEmail(receipt, 'josh@example.com', false)
    ).resolves.toEqual({ skipped: true });
  });
});
