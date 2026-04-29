import * as Notifications from 'expo-notifications';
import { getInsightForType } from './insights';

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(
  hour: number = 9
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your FounderType check-in",
      body: "Did you complete today's action? Keep your streak going.",
      sound: true,
    },
    trigger: {
      hour: hour,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleWeeklyInsight(
  founderType: string
) {
  const weekNumber = Math.floor(
    Date.now() / (7 * 24 * 60 * 60 * 1000)
  );
  const insight = getInsightForType(founderType, weekNumber);
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Your weekly insight`,
      body: insight,
      sound: true,
    },
    trigger: {
      weekday: 2,
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });
}
