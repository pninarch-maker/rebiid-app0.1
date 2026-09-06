import { Platform } from 'react-native';

import {
  AndroidImportance,
  getNotificationChannelAsync,
  setNotificationChannelAsync,
  type NotificationContentInput,
} from '@/lib/localNotifications';

import type { NotificationCategoryPreference } from './notificationCategories';
import {
  inspectAllAndroidNotificationChannels,
  logChannelEnsurePayload,
  NOTIFICATION_DIAGNOSTICS_ENABLED,
} from './notificationDiagnostics';
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_IDS,
  getAndroidNotificationDeliveryConfig,
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
  getAndroidNotificationDeliveryConfig,
  resolveNotificationChannelId,
  resolveNotificationChannelIdForMode,
  type NotificationMode,
};

const CHANNEL_LABELS: Record<NotificationMode, { name: string; description: string }> = {
  device_sound: {
    name: 'תזכורות — צליל מהמכשיר',
    description: 'בחר צליל התראה בהגדרות Android',
  },
  vibration_only: {
    name: 'תזכורות — רטט בלבד',
    description: 'הגדר רטט בלבד בהגדרות Android',
  },
  silent: {
    name: 'תזכורות — שקט',
    description: 'הגדר התראה שקטה בהגדרות Android',
  },
};

const ALL_MODES: NotificationMode[] = ['device_sound', 'vibration_only', 'silent'];

async function ensureChannelForMode(mode: NotificationMode): Promise<void> {
  const config = getAndroidNotificationDeliveryConfig(mode);
  const labels = CHANNEL_LABELS[mode];

  if (config.createChannelOnlyIfMissing) {
    try {
      const existing = await getNotificationChannelAsync(config.channelId);
      if (existing) {
        // Preserve user-selected Android channel sound — do not recreate.
        return;
      }
    } catch (error) {
      console.warn('[notifications] getNotificationChannelAsync failed', error);
    }
  }

  const importance =
    config.channelImportance === 'high'
      ? AndroidImportance.HIGH
      : AndroidImportance.DEFAULT;

  // Always include `sound` as a real string (never JS null/undefined) so the
  // native bridge keeps containsKey("sound") true and setSound is invoked.
  const payload = {
    name: labels.name,
    description: labels.description,
    importance,
    sound: config.channelSound,
    enableVibrate: config.enableVibrate,
    vibrationPattern: config.vibrationPattern,
  };

  logChannelEnsurePayload(mode, {
    channelId: config.channelId,
    sound: config.channelSound,
    enableVibrate: config.enableVibrate,
    vibrationPattern: config.vibrationPattern,
    importance: config.channelImportance,
  });

  await setNotificationChannelAsync(config.channelId, payload);
}

export async function ensureAndroidNotificationChannels(
  _settings: AppSettings,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    for (const mode of ALL_MODES) {
      await ensureChannelForMode(mode);
    }

    if (NOTIFICATION_DIAGNOSTICS_ENABLED) {
      await inspectAllAndroidNotificationChannels();
    }
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
      mode === 'vibration_only' || mode === 'silent' ? 'device_sound' : mode;
  }

  const delivery = getAndroidNotificationDeliveryConfig(effectiveMode);
  let vibrate = delivery.vibrationPattern;

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
    sound: delivery.contentSound,
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
  return getAndroidNotificationDeliveryConfig(mode).channelId;
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
  return getAndroidNotificationDeliveryConfig(
    resolveEffectiveNotificationMode(settings),
  ).shouldPlaySound;
}

/** @deprecated Use notificationMode migration instead. */
export function shouldPlayNotificationSound(settings: AppSettings): boolean {
  return shouldPlaySoundForMode(migrateNotificationMode(settings));
}

export { resolveContentSoundForMode, vibrationPatternForMode };
