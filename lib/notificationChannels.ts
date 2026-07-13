import { Platform } from 'react-native';

import {
  AndroidImportance,
  setNotificationChannelAsync,
  type NotificationContentInput,
} from '@/lib/localNotifications';

import type { AppSettings, NotificationSound } from './settingsTypes';
import type { NotificationCategoryPreference } from './notificationCategories';

// REBIID intentionally does not use remote push notifications.
// All reminders are scheduled locally on the device.

export const NOTIFICATION_CHANNELS = {
  default: 'reminders-default',
  silent: 'reminders-silent',
  gentle: 'reminders-gentle',
  classic: 'reminders-classic',
} as const;

const CHANNEL_LABELS: Record<NotificationSound, string> = {
  default: 'תזכורות — ברירת מחדל',
  silent: 'תזכורות — שקט',
  gentle: 'תזכורות — עדין',
  classic: 'תזכורות — קלאסי',
};

export function shouldPlayNotificationSound(settings: AppSettings): boolean {
  return settings.notificationSoundEnabled && settings.notificationSound !== 'silent';
}

export function resolveNotificationChannelId(settings: AppSettings): string {
  if (!shouldPlayNotificationSound(settings)) {
    return NOTIFICATION_CHANNELS.silent;
  }

  switch (settings.notificationSound) {
    case 'gentle':
      return NOTIFICATION_CHANNELS.gentle;
    case 'classic':
      return NOTIFICATION_CHANNELS.classic;
    case 'default':
    default:
      return NOTIFICATION_CHANNELS.default;
  }
}

export async function ensureAndroidNotificationChannels(
  settings: AppSettings,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const vibrationPattern = settings.notificationVibrationEnabled
    ? [0, 250, 250, 250]
    : [0];

  const baseOptions = {
    importance: AndroidImportance.HIGH,
    enableVibrate: settings.notificationVibrationEnabled,
    vibrationPattern,
  };

  try {
    await setNotificationChannelAsync(NOTIFICATION_CHANNELS.default, {
      ...baseOptions,
      name: CHANNEL_LABELS.default,
      sound: 'default',
    });

    await setNotificationChannelAsync(NOTIFICATION_CHANNELS.gentle, {
      ...baseOptions,
      name: CHANNEL_LABELS.gentle,
      sound: 'default',
    });

    await setNotificationChannelAsync(NOTIFICATION_CHANNELS.classic, {
      ...baseOptions,
      name: CHANNEL_LABELS.classic,
      sound: 'default',
    });

    await setNotificationChannelAsync(NOTIFICATION_CHANNELS.silent, {
      ...baseOptions,
      name: CHANNEL_LABELS.silent,
      sound: undefined,
      enableVibrate: false,
      vibrationPattern: [0],
    });
  } catch (error) {
    console.warn('[notifications] channel setup failed', error);
  }
}

export function buildCategoryNotificationContent(
  preference: NotificationCategoryPreference,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): NotificationContentInput {
  const playSound = shouldCategoryPlaySound(preference);
  const vibrate = shouldCategoryVibrate(preference);
  const channelId = resolveCategoryChannelId(preference);
  const vibrationPattern = vibrate ? [0, 250, 250, 250] : [0];

  return {
    title,
    body,
    data,
    sound: playSound ? 'default' : false,
    ...(Platform.OS === 'android'
      ? {
          channelId,
          vibrate: vibrationPattern,
        }
      : {}),
  };
}

function shouldCategoryPlaySound(preference: NotificationCategoryPreference): boolean {
  if (preference.deliveryMode === 'disabled') {
    return false;
  }

  if (preference.deliveryMode === 'vibration_only' || preference.deliveryMode === 'center_only') {
    return false;
  }

  if (preference.deliveryMode === 'sound_only' || preference.deliveryMode === 'full') {
    return preference.sound !== 'silent';
  }

  return false;
}

function shouldCategoryVibrate(preference: NotificationCategoryPreference): boolean {
  if (!preference.vibrationEnabled || preference.deliveryMode === 'disabled') {
    return false;
  }

  if (preference.deliveryMode === 'sound_only' || preference.deliveryMode === 'center_only') {
    return false;
  }

  return (
    preference.deliveryMode === 'full' ||
    preference.deliveryMode === 'silent' ||
    preference.deliveryMode === 'vibration_only'
  );
}

function resolveCategoryChannelId(preference: NotificationCategoryPreference): string {
  if (!shouldCategoryPlaySound(preference)) {
    return NOTIFICATION_CHANNELS.silent;
  }

  switch (preference.sound) {
    case 'gentle':
      return NOTIFICATION_CHANNELS.gentle;
    case 'classic':
      return NOTIFICATION_CHANNELS.classic;
    case 'default':
    default:
      return NOTIFICATION_CHANNELS.default;
  }
}

export function buildNotificationContent(
  settings: AppSettings,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): NotificationContentInput {
  const channelId = resolveNotificationChannelId(settings);
  const playSound = shouldPlayNotificationSound(settings);

  return {
    title,
    body,
    data,
    sound: playSound ? 'default' : false,
    ...(Platform.OS === 'android'
      ? {
          channelId,
          vibrate: settings.notificationVibrationEnabled ? [0, 250, 250, 250] : [0],
        }
      : {}),
  };
}
