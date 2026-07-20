import { Platform } from 'react-native';

import {
  AndroidImportance,
  setNotificationChannelAsync,
  type NotificationContentInput,
} from '@/lib/localNotifications';

import type { NotificationCategoryPreference } from './notificationCategories';
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_IDS,
  REBIID_GENTLE_SOUND,
  migrateNotificationMode,
  resolveContentSoundForMode,
  resolveEffectiveNotificationMode,
  resolveNotificationChannelId,
  resolveNotificationChannelIdForMode,
  shouldPlaySoundForMode,
  vibrationPatternForMode,
  type NotificationMode,
} from './notificationMode';
import type { AppSettings } from './settingsTypes';

// REBIID intentionally does not use remote push notifications.
// All reminders are scheduled locally on the device.

export {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_IDS,
  REBIID_GENTLE_SOUND,
  resolveNotificationChannelId,
  resolveNotificationChannelIdForMode,
  type NotificationMode,
};

const CHANNEL_LABELS: Record<NotificationMode, { name: string; description: string }> = {
  rebiid_sound: {
    name: 'תזכורות — צליל REBIID',
    description: 'צליל מותאם של REBIID עם רטט',
  },
  device_sound: {
    name: 'תזכורות — צליל מהמכשיר',
    description: 'בחר צליל התראה בהגדרות Android',
  },
  vibration_only: {
    name: 'תזכורות — רטט בלבד',
    description: 'רטט ללא צליל',
  },
  silent: {
    name: 'תזכורות — שקט',
    description: 'ללא צליל וללא רטט',
  },
};

export async function ensureAndroidNotificationChannels(
  _settings: AppSettings,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const vibrationPattern = [0, 250, 250, 250];

  try {
    await setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.rebiidSound, {
      name: CHANNEL_LABELS.rebiid_sound.name,
      description: CHANNEL_LABELS.rebiid_sound.description,
      importance: AndroidImportance.HIGH,
      sound: REBIID_GENTLE_SOUND,
      enableVibrate: true,
      vibrationPattern,
    });

    await setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.deviceSound, {
      name: CHANNEL_LABELS.device_sound.name,
      description: CHANNEL_LABELS.device_sound.description,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern,
    });

    await setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.vibrationOnly, {
      name: CHANNEL_LABELS.vibration_only.name,
      description: CHANNEL_LABELS.vibration_only.description,
      importance: AndroidImportance.HIGH,
      sound: undefined,
      enableVibrate: true,
      vibrationPattern,
    });

    await setNotificationChannelAsync(NOTIFICATION_CHANNEL_IDS.silent, {
      name: CHANNEL_LABELS.silent.name,
      description: CHANNEL_LABELS.silent.description,
      importance: AndroidImportance.DEFAULT,
      sound: undefined,
      enableVibrate: false,
      vibrationPattern: [0],
    });
  } catch (error) {
    console.warn('[notifications] channel setup failed', error);
  }
}

function buildContentForMode(
  mode: NotificationMode,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  categoryPreference?: NotificationCategoryPreference,
): NotificationContentInput {
  let effectiveMode = mode;

  if (categoryPreference?.deliveryMode === 'sound_only') {
    effectiveMode =
      mode === 'vibration_only' || mode === 'silent'
        ? 'rebiid_sound'
        : mode;
  }

  const sound = resolveContentSoundForMode(effectiveMode);
  let vibrate = vibrationPatternForMode(effectiveMode);

  if (categoryPreference?.deliveryMode === 'sound_only') {
    vibrate = [0];
  }

  if (
    categoryPreference &&
    !categoryPreference.vibrationEnabled &&
    categoryPreference.deliveryMode !== 'vibration_only'
  ) {
    vibrate = [0];
  }

  return {
    title,
    body,
    data,
    sound,
    ...(Platform.OS === 'android' ? { vibrate } : {}),
  };
}

export function buildCategoryNotificationContent(
  settings: AppSettings,
  preference: NotificationCategoryPreference,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): NotificationContentInput {
  const mode = resolveEffectiveNotificationMode(settings, preference);
  return buildContentForMode(mode, title, body, data, preference);
}

export function resolveCategoryAndroidChannelId(
  settings: AppSettings,
  preference: NotificationCategoryPreference,
): string {
  const mode = resolveEffectiveNotificationMode(settings, preference);
  return resolveNotificationChannelIdForMode(mode);
}

export function buildNotificationContent(
  settings: AppSettings,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): NotificationContentInput {
  const mode = resolveEffectiveNotificationMode(settings);
  return buildContentForMode(mode, title, body, data);
}

export function shouldForegroundPlaySound(settings: AppSettings): boolean {
  return shouldPlaySoundForMode(resolveEffectiveNotificationMode(settings));
}

/** @deprecated Use notificationMode migration instead. */
export function shouldPlayNotificationSound(settings: AppSettings): boolean {
  return shouldPlaySoundForMode(migrateNotificationMode(settings));
}
