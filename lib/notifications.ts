import { Platform } from 'react-native';

import { currentAppSettings } from '@/lib/appState';
import {
  buildCategoryNotificationContent,
  buildNotificationContent,
  ensureAndroidNotificationChannels,
} from '@/lib/notificationChannels';
import {
  getNotificationCategoryPreferenceForReminder,
  shouldScheduleReminderNotification,
} from '@/lib/notificationCategoryPrefs';
import { getNotificationTriggerDate } from '@/lib/reminderTiming';
import { JewishEngine } from '@/src/engine/JewishEngine';

import {
  addNotificationResponseReceivedListener,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationHandler,
} from './localNotifications';
import {
  getNotificationsEnabled,
  loadAppSettings,
} from './settings';

// REBIID intentionally does not use remote push notifications.
// All reminders are scheduled locally on the device.

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound:
      currentAppSettings.notificationSoundEnabled &&
      currentAppSettings.notificationSound !== 'silent',
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isNativePlatform(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

/** Check OS permission without prompting the user. */
export async function areNotificationPermissionsGranted(): Promise<boolean> {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    const current = await getPermissionsAsync();
    return current.granted;
  } catch (error) {
    console.warn('[notifications] permission check failed', error);
    return false;
  }
}

/** Request OS permission — call only from explicit user actions (Settings toggle / test). */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    const current = await getPermissionsAsync();

    if (current.granted) {
      return true;
    }

    const requested = await requestPermissionsAsync();
    return requested.granted;
  } catch (error) {
    console.warn('[notifications] permission request failed', error);
    return false;
  }
}

export async function syncLocalNotifications(): Promise<number> {
  if (!isNativePlatform()) {
    return 0;
  }

  try {
    await cancelAllScheduledNotificationsAsync();
    await ensureAndroidNotificationChannels(currentAppSettings);

    const upcoming = JewishEngine.getUpcomingReminders(30);
    const now = Date.now();
    let scheduled = 0;

    for (const reminder of upcoming) {
      if (!shouldScheduleReminderNotification(reminder, currentAppSettings)) {
        continue;
      }

      const triggerDate = getNotificationTriggerDate(reminder, currentAppSettings);

      if (!triggerDate || triggerDate.getTime() <= now) {
        continue;
      }

      const categoryPreference = getNotificationCategoryPreferenceForReminder(
        reminder,
        currentAppSettings,
      );

      await scheduleNotificationAsync({
        identifier: reminder.id,
        content: buildCategoryNotificationContent(
          categoryPreference,
          reminder.title,
          reminder.message,
          { reminderId: reminder.id },
        ),
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      scheduled += 1;
    }

    return scheduled;
  } catch (error) {
    console.warn('[notifications] sync failed', error);
    return 0;
  }
}

/**
 * Sync local schedules when notifications are enabled and already permitted.
 * Does not prompt for permission — launch / settings reschedule must not
 * request OS permission without user context.
 */
export async function syncNotificationsIfEnabled(): Promise<void> {
  if (!isNativePlatform()) {
    return;
  }

  try {
    const enabled = await getNotificationsEnabled();

    if (!enabled) {
      await cancelAllScheduledNotificationsAsync();
      return;
    }

    const granted = await areNotificationPermissionsGranted();

    if (!granted) {
      return;
    }

    await syncLocalNotifications();
  } catch (error) {
    console.warn('[notifications] sync if enabled failed', error);
  }
}

export async function enableNotifications(): Promise<boolean> {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    const granted = await requestNotificationPermissions();

    if (!granted) {
      return false;
    }

    await syncLocalNotifications();
    return true;
  } catch (error) {
    console.warn('[notifications] enable failed', error);
    return false;
  }
}

export async function disableNotifications(): Promise<void> {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notifications] disable failed', error);
  }
}

/** Schedules a one-off local test notification a few seconds from now. */
export async function scheduleTestNotification(): Promise<boolean> {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    await ensureAndroidNotificationChannels(currentAppSettings);

    const granted = await requestNotificationPermissions();

    if (!granted) {
      return false;
    }

    await scheduleNotificationAsync({
      content: buildNotificationContent(
        currentAppSettings,
        'היי, זו תזכורת ניסיון 👋',
        'REBIID עובד — ככה ייראו התזכורות שלך.',
      ),
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });

    return true;
  } catch (error) {
    console.warn('[notifications] test schedule failed', error);
    return false;
  }
}

async function requestPermissionOnFirstLaunch(): Promise<void> {
  // Permission is requested only when the user enables notifications in Settings,
  // after reading the local-only privacy note — not on silent first launch.
}

function registerLocalNotificationListeners(): void {
  if (!isNativePlatform()) {
    return;
  }

  try {
    addNotificationResponseReceivedListener(() => {
      // Local notification tap — no navigation needed for MVP.
    });
  } catch (error) {
    console.warn('[notifications] listener registration failed', error);
  }
}

export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await loadAppSettings();
    await ensureAndroidNotificationChannels(currentAppSettings);
    registerLocalNotificationListeners();
    await requestPermissionOnFirstLaunch();
    await syncNotificationsIfEnabled();
  } catch (error) {
    console.warn('[notifications] initialize failed', error);
  }
}

export async function rescheduleNotificationsAfterSettingsChange(): Promise<void> {
  await ensureAndroidNotificationChannels(currentAppSettings);
  await syncNotificationsIfEnabled();
}
