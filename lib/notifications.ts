import * as Notifications from 'expo-notifications';

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour: number = 9) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your FounderType check-in',
      body: "Did you complete today's action? Keep your streak going.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    } as any,
  });
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleWeeklyInsight(founderType: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your weekly check-in',
      body: 'How is your commitment going? Stay accountable and keep building.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2,
      hour: 8,
      minute: 0,
    } as any,
  });
}

export async function scheduleWeeklyMirror(
  commitmentText: string,
  founderType: string,
  checkInCount: number,
  daysSinceCommitment: number
) {
  // Cancel existing scheduled notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  const isOnTrack = checkInCount >= daysSinceCommitment * 0.6;
  const week = Math.ceil(daysSinceCommitment / 7);
  const daysLeft = Math.max(0, 30 - daysSinceCommitment);
  const snippet = commitmentText.substring(0, 60);

  const onTrackMessages = [
    `Day ${daysSinceCommitment}. You're in the top 23% of ${founderType} users who reach this point. Most quit by Day 5. Keep going.`,
    `${checkInCount} check-ins completed. You said you were different. So far, you're right.`,
    `Week ${week} done. Your commitment: "${commitmentText.substring(0, 50)}..." Still standing.`,
  ];

  const offTrackMessages = [
    `You made a commitment ${daysSinceCommitment} days ago. You've checked in ${checkInCount} times. At this rate you will repeat the same pattern that stopped you before. Is that acceptable to you?`,
    `${daysSinceCommitment - checkInCount} missed days. Your commitment is still waiting. Every day you don't show up is a data point about who you actually are right now — not who you want to be.`,
    `You said: "${snippet}..." The deadline is in ${daysLeft} days. What happened this week?`,
  ];

  const messages = isOnTrack ? onTrackMessages : offTrackMessages;
  const message = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: isOnTrack ? 'FounderType Check-In' : 'FounderType — Be Honest',
      body: message,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2,
      hour: 8,
      minute: 0,
    } as any,
  });
}

export async function sendMissedDaysAlert(daysMissed: number, commitmentText: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'FounderType — Be Honest',
      body: `${daysMissed} days without checking in. "${commitmentText.substring(0, 60)}..." Your commitment is still waiting.`,
      sound: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1 
    } as any,
  });
}
