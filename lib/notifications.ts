import { Platform } from 'react-native';

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
  formatChannelSnapshotsForAlert,
  inspectAllAndroidNotificationChannels,
  logNotificationScheduleDiagnostic,
  NOTIFICATION_DIAGNOSTICS_ENABLED,
} from '@/lib/notificationDiagnostics';
import {
  getNotificationCategoryPreferenceForReminder,
  shouldScheduleReminderNotification,
} from '@/lib/notificationCategoryPrefs';
import { getAndroidNotificationDeliveryConfig } from '@/lib/notificationMode';
import { getNotificationTriggerDate } from '@/lib/reminderTiming';
import { JewishEngine } from '@/src/engine/JewishEngine';

import {
  addNotificationResponseReceivedListener,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationHandler,
} from './localNotifications';
import {
  getAppSettings,
  getNotificationsEnabled,
  loadAppSettings,
} from './settings';

// REBIID intentionally does not use remote push notifications.
// All reminders are scheduled locally on the device.

/** Built-in and personal reminder notification identifiers start with YYYY-MM-DD-. */
const REBIID_NOTIFICATION_ID_PATTERN = /^\d{4}-\d{2}-\d{2}-/;

let syncInFlight: Promise<number> | null = null;
let channelsEnsuredThisSession = false;

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: shouldForegroundPlaySound(currentAppSettings),
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

function isNativePlatform(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

function isRebiidOwnedNotificationId(identifier: string | null | undefined): boolean {
  return Boolean(identifier && REBIID_NOTIFICATION_ID_PATTERN.test(identifier));
}

function getTriggerEpochMs(trigger: unknown): number | null {
  if (!trigger || typeof trigger !== 'object') {
    return null;
  }

  const candidate = trigger as { date?: Date | number | string; value?: number };
  if (candidate.date !== undefined) {
    const date =
      candidate.date instanceof Date ? candidate.date : new Date(candidate.date);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  if (typeof candidate.value === 'number') {
    return candidate.value;
  }

  return null;
}

async function cancelRebiidOwnedNotifications(): Promise<void> {
  const scheduled = await getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (isRebiidOwnedNotificationId(notification.identifier)) {
      await cancelScheduledNotificationAsync(notification.identifier!);
    }
  }
}

type DesiredNotification = {
  identifier: string;
  content: ReturnType<typeof buildCategoryNotificationContent>;
  triggerDate: Date;
  channelId: string | null;
  deliveryMode: ReturnType<typeof getAndroidNotificationDeliveryConfig>;
};

async function buildDesiredNotifications(now: number): Promise<Map<string, DesiredNotification>> {
  const desired = new Map<string, DesiredNotification>();
  const upcoming = JewishEngine.getUpcomingReminders(30);

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

    const content = buildCategoryNotificationContent(
      currentAppSettings,
      categoryPreference,
      reminder.title,
      reminder.message,
      { reminderId: reminder.id },
    );

    const channelId =
      Platform.OS === 'android'
        ? resolveCategoryAndroidChannelId(currentAppSettings, categoryPreference)
        : null;

    desired.set(reminder.id, {
      identifier: reminder.id,
      content,
      triggerDate,
      channelId,
      deliveryMode: getAndroidNotificationDeliveryConfig(currentAppSettings.notificationMode),
    });
  }

  return desired;
}

async function reconcileScheduledNotifications(desired: Map<string, DesiredNotification>): Promise<number> {
  const existing = await getAllScheduledNotificationsAsync();
  const existingById = new Map(
    existing
      .filter((item) => isRebiidOwnedNotificationId(item.identifier))
      .map((item) => [item.identifier!, item]),
  );

  for (const [identifier, notification] of existingById) {
    if (!desired.has(identifier)) {
      await cancelScheduledNotificationAsync(identifier);
    }
  }

  let scheduled = 0;

  for (const [identifier, plan] of desired) {
    const existingNotification = existingById.get(identifier);
    const existingTriggerMs = getTriggerEpochMs(existingNotification?.trigger);
    const plannedTriggerMs = plan.triggerDate.getTime();

    if (
      existingNotification &&
      existingTriggerMs !== null &&
      Math.abs(existingTriggerMs - plannedTriggerMs) < 1000
    ) {
      continue;
    }

    if (existingNotification) {
      await cancelScheduledNotificationAsync(identifier);
    }

    logNotificationScheduleDiagnostic({
      kind: 'category',
      persistedMode: currentAppSettings.notificationMode,
      delivery: plan.deliveryMode,
      identifier: plan.identifier,
      contentSound: plan.content.sound as string | false | undefined,
      triggerChannelId: plan.channelId,
    });

    await scheduleNotificationAsync({
      identifier: plan.identifier,
      content: plan.content,
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: plan.triggerDate,
        ...(plan.channelId ? { channelId: plan.channelId } : {}),
      },
    });

    scheduled += 1;
  }

  return scheduled;
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

async function performSyncLocalNotifications(): Promise<number> {
  if (!isNativePlatform()) {
    return 0;
  }

  try {
    if (!channelsEnsuredThisSession) {
      await ensureAndroidNotificationChannels(currentAppSettings);
      channelsEnsuredThisSession = true;
    }

    const now = Date.now();
    const desired = await buildDesiredNotifications(now);
    return await reconcileScheduledNotifications(desired);
  } catch (error) {
    console.warn('[notifications] sync failed', error);
    return 0;
  }
}

export async function syncLocalNotifications(): Promise<number> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = performSyncLocalNotifications().finally(() => {
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
      await cancelRebiidOwnedNotifications();
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
    await cancelRebiidOwnedNotifications();
  } catch (error) {
    console.warn('[notifications] disable failed', error);
  }
}

export type ScheduleTestNotificationResult = {
  success: boolean;
  diagnosticsText: string | null;
};

/**
 * Schedules a one-off local test notification a few seconds from now.
 * Reloads persisted settings so the selected mode cannot be overwritten by stale memory.
 */
export async function scheduleTestNotification(): Promise<ScheduleTestNotificationResult> {
  if (!isNativePlatform()) {
    return { success: false, diagnosticsText: null };
  }

  try {
    const settings = await getAppSettings();
    await ensureAndroidNotificationChannels(settings);

    const granted = await requestNotificationPermissions();

    if (!granted) {
      return { success: false, diagnosticsText: null };
    }

    const mode = settings.notificationMode;
    const delivery = getAndroidNotificationDeliveryConfig(mode);
    const content = buildNotificationContent(
      settings,
      'היי, זו תזכורת ניסיון 👋',
      'REBIID עובד — ככה ייראו התזכורות שלך.',
    );

    const channelId = Platform.OS === 'android' ? delivery.channelId : null;

    logNotificationScheduleDiagnostic({
      kind: 'test',
      persistedMode: mode,
      delivery,
      identifier: null,
      contentSound: content.sound as string | false | undefined,
      triggerChannelId: channelId,
    });

    await scheduleNotificationAsync({
      content,
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        ...(channelId ? { channelId } : {}),
      },
    });

    let diagnosticsText: string | null = null;
    if (NOTIFICATION_DIAGNOSTICS_ENABLED && Platform.OS === 'android') {
      const snapshots = await inspectAllAndroidNotificationChannels();
      diagnosticsText = formatChannelSnapshotsForAlert(mode, snapshots);
    }

    return { success: true, diagnosticsText };
  } catch (error) {
    console.warn('[notifications] test schedule failed', error);
    return { success: false, diagnosticsText: null };
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
    registerLocalNotificationListeners();
    await requestPermissionOnFirstLaunch();
    await syncNotificationsIfEnabled();
  } catch (error) {
    console.warn('[notifications] initialize failed', error);
  }
}

export async function rescheduleNotificationsAfterSettingsChange(): Promise<void> {
  channelsEnsuredThisSession = false;
  logNotificationScheduleDiagnostic({
    kind: 'rescheduled',
    persistedMode: currentAppSettings.notificationMode,
    delivery: getAndroidNotificationDeliveryConfig(currentAppSettings.notificationMode),
    identifier: null,
    contentSound: undefined,
    triggerChannelId: Platform.OS === 'android'
      ? resolveNotificationChannelId(currentAppSettings)
      : null,
  });
  await ensureAndroidNotificationChannels(currentAppSettings);
  channelsEnsuredThisSession = true;
  await syncNotificationsIfEnabled();
}
