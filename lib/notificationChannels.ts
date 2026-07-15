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

/** Custom sound basename registered via expo-notifications `sounds` in app.json. */
export const REBIID_GENTLE_SOUND = 'rebiid-gentle.wav';

/**
 * Android channel ids. Sound binding is immutable after first create — bump the
 * gentle channel version when changing the custom sound (v2 → v3, …).
 */
export const NOTIFICATION_CHANNELS = {
  default: 'reminders-default',
  silent: 'reminders-silent',
  /** Custom gentle WAV — new id so devices with old `reminders-gentle` get the sound. */
  gentle: 'rebiid-reminders-gentle-v2',
  classic: 'reminders-classic',
} as const;

const CHANNEL_LABELS: Record<NotificationSound, string> = {
  default: 'תזכורות — ברירת מחדל',
  silent: 'תזכורות — שקט',
  gentle: 'תזכורות — צליל עדין',
  classic: 'תזכורות — קלאסי',
};

export function shouldPlayNotificationSound(settings: AppSettings): boolean {
  return settings.notificationSoundEnabled && settings.notificationSound !== 'silent';
}

/** Content / channel sound value for the selected preference. */
export function resolveNotificationSoundFile(
  sound: NotificationSound,
  playSound: boolean,
): string | false {
  if (!playSound || sound === 'silent') {
    return false;
  }

  if (sound === 'gentle') {
    return REBIID_GENTLE_SOUND;
  }

  return 'default';
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
      sound: REBIID_GENTLE_SOUND,
      importance: AndroidImportance.HIGH,
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
  const vibrationPattern = vibrate ? [0, 250, 250, 250] : [0];
  const sound = resolveNotificationSoundFile(preference.sound, playSound);

  return {
    title,
    body,
    data,
    sound,
    ...(Platform.OS === 'android' ? { vibrate: vibrationPattern } : {}),
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

/** Android channel id for a category preference (Expo 54: set on the trigger). */
export function resolveCategoryAndroidChannelId(
  preference: NotificationCategoryPreference,
): string {
  return resolveCategoryChannelId(preference);
}

export function buildNotificationContent(
  settings: AppSettings,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): NotificationContentInput {
  const playSound = shouldPlayNotificationSound(settings);
  const sound = resolveNotificationSoundFile(settings.notificationSound, playSound);

  return {
    title,
    body,
    data,
    sound,
    ...(Platform.OS === 'android'
      ? {
          vibrate: settings.notificationVibrationEnabled ? [0, 250, 250, 250] : [0],
        }
      : {}),
  };
}
