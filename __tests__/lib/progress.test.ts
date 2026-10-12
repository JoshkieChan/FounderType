import { getProgress } from '../../lib/progress';
import { Commitment } from '../../types/commitment';

const commitment = (days: string[]) =>
  ({ created_at: '2026-10-01T23:59:00Z', check_ins: days }) as Commitment;
describe('UTC commitment progress', () => {
  it('advances across UTC midnight without waiting 24 hours', () => {
    expect(
      getProgress(commitment([]), new Date('2026-10-02T00:01:00Z')).currentDay
    ).toBe(2);
  });
  it('deduplicates check-ins and excludes future or out-of-cycle days', () => {
    expect(
      getProgress(
        commitment(['2026-09-30', '2026-10-01', '2026-10-01', '2026-10-03']),
        new Date('2026-10-02T12:00:00Z')
      ).completedDays
    ).toEqual([1]);
  });
  it('keeps a streak through yesterday and breaks it after a missed day', () => {
    const c = commitment(['2026-10-01', '2026-10-02']);
    expect(getProgress(c, new Date('2026-10-03T12:00:00Z')).streak).toBe(2);
    expect(getProgress(c, new Date('2026-10-04T12:00:00Z')).streak).toBe(0);
  });
});
