import { AppState, Platform, type AppStateStatus } from 'react-native';

import { currentAppSettings } from '@/lib/appState';
import {
  buildCategoryNotificationContent,
  buildNotificationContent,
  ensureAndroidNotificationChannels,
  resolveCategoryAndroidChannelId,
  resolveNotificationChannelId,
  shouldForegroundPlaySound,
} from '@/lib/notificationChannels';
import {
  getNotificationCategoryPreferenceForReminder,
  shouldScheduleReminderNotification,
} from '@/lib/notificationCategoryPrefs';
import { planNotifications } from '@/lib/notificationPlan';
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
    shouldPlaySound: shouldForegroundPlaySound(currentAppSettings),
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

/** Re-sync when the app returns to foreground if the last sync is older than this. */
const FOREGROUND_RESYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

let lastSyncAt = 0;
let syncInFlight: Promise<number> | null = null;

async function runLocalNotificationSync(): Promise<number> {
  await cancelAllScheduledNotificationsAsync();
  await ensureAndroidNotificationChannels(currentAppSettings);

  const upcoming = JewishEngine.getUpcomingReminders(30);

  const plan = planNotifications(
    upcoming
      .filter((reminder) => shouldScheduleReminderNotification(reminder, currentAppSettings))
      .map((reminder) => {
        const preference = getNotificationCategoryPreferenceForReminder(
          reminder,
          currentAppSettings,
        );
        return {
          reminder,
          triggerDate: getNotificationTriggerDate(reminder, currentAppSettings),
          // Only merge reminders that would play on the same channel / sound mode.
          groupKey: resolveCategoryAndroidChannelId(currentAppSettings, preference),
        };
      }),
  );

  let scheduled = 0;

  for (const item of plan) {
    const categoryPreference = getNotificationCategoryPreferenceForReminder(
      item.primary,
      currentAppSettings,
    );

    const content = buildCategoryNotificationContent(
      currentAppSettings,
      categoryPreference,
      item.title,
      item.body,
      {
        reminderId: item.primary.id,
        reminderIds: item.reminders.map((reminder) => reminder.id),
      },
    );

    await scheduleNotificationAsync({
      identifier: item.identifier,
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: item.triggerDate,
        ...(Platform.OS === 'android' ? { channelId: item.groupKey } : {}),
      },
    });

    scheduled += 1;
  }

  lastSyncAt = Date.now();
  return scheduled;
}

export async function syncLocalNotifications(): Promise<number> {
  if (!isNativePlatform()) {
    return 0;
  }

  // Serialize: overlapping cancel-all / schedule passes could interleave.
  if (syncInFlight) {
    await syncInFlight.catch(() => 0);
  }

  syncInFlight = runLocalNotificationSync()
    .catch((error) => {
      console.warn('[notifications] sync failed', error);
      return 0;
    })
    .finally(() => {
      syncInFlight = null;
    });

  return syncInFlight;
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

    const content = buildNotificationContent(
      currentAppSettings,
      'היי, זו תזכורת ניסיון 👋',
      'REBIID עובד — ככה ייראו התזכורות שלך.',
    );

    await scheduleNotificationAsync({
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        ...(Platform.OS === 'android'
          ? { channelId: resolveNotificationChannelId(currentAppSettings) }
          : {}),
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

let appStateSubscription: { remove: () => void } | null = null;

/**
 * Local reminders are planned 30 days ahead. Refresh the schedule whenever the
 * app comes back to foreground (throttled), so a user who opens the app every
 * few weeks always has the next month scheduled.
 */
function registerForegroundResync(): void {
  if (!isNativePlatform() || appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state !== 'active') {
      return;
    }
    if (Date.now() - lastSyncAt < FOREGROUND_RESYNC_INTERVAL_MS) {
      return;
    }
    void syncNotificationsIfEnabled();
  });
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
    registerForegroundResync();
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
