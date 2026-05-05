import { buildAccountabilityAgentState } from '../../lib/accountabilityAgent';
import { Commitment } from '../../types/commitment';

const baseCommitment: Commitment = {
  id: 'commitment-1',
  user_id: 'user-1',
  commitment_text: 'Launch my FounderType landing page',
  daily_action: 'Ship one visible improvement',
  founder_type: 'The 30-Day Executor',
  created_at: '2026-05-01T00:00:00.000Z',
  deadline: '2026-05-31T00:00:00.000Z',
  completed_at: null,
  abandoned_at: null,
  edited_at: null,
  status: 'active',
  check_ins: [],
  days_completed: 0,
  abandoned_on_day: null,
};

describe('buildAccountabilityAgentState', () => {
  it('names the accountability pattern for a normal day', () => {
    const state = buildAccountabilityAgentState({
      commitment: baseCommitment,
      todayAlreadyCheckedIn: false,
      daysSinceStart: 1,
      isDeadlinePassed: false,
    });

    expect(state.mode).toBe('normal');
    expect(state.message).toContain('letting deadlines slide');
  });

  it('marks the user as behind when missed days accumulate', () => {
    const state = buildAccountabilityAgentState({
      commitment: baseCommitment,
      todayAlreadyCheckedIn: false,
      daysSinceStart: 4,
      isDeadlinePassed: false,
    });

    expect(state.mode).toBe('behind');
    expect(state.missedDays).toBe(4);
  });

  it('uses deadline mode when the commitment needs a final answer', () => {
    const state = buildAccountabilityAgentState({
      commitment: baseCommitment,
      todayAlreadyCheckedIn: false,
      daysSinceStart: 30,
      isDeadlinePassed: true,
    });

    expect(state.mode).toBe('deadline');
    expect(state.prompt).toContain('complete');
  });
});
