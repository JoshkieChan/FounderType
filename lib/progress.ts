import { Commitment } from '../types/commitment';
const DAY = 86400000;
export function getProgress(commitment: Commitment, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const start = Date.parse(commitment.created_at.slice(0, 10));
  const days = [...new Set(commitment.check_ins || [])]
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= today)
    .sort();
  const completedDays = days
    .map((day) => Math.round((Date.parse(day) - start) / DAY) + 1)
    .filter((day) => day >= 1 && day <= 30);
  let cursor = Date.parse(today);
  if (!days.includes(today)) cursor -= DAY;
  let streak = 0;
  while (days.includes(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= DAY;
  }
  return {
    currentDay: Math.max(
      1,
      Math.min(30, Math.floor((Date.parse(today) - start) / DAY) + 1)
    ),
    completedDays,
    streak,
    lastCheckInDate: days.at(-1) || null,
  };
}
