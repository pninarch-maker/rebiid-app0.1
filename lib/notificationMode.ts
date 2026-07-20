import type { NotificationCategoryPreference } from './notificationCategories';
import type { AppSettings, NotificationSound } from './settingsTypes';

/** Global notification delivery mode — mutually exclusive. */
export type NotificationMode = 'rebiid_sound' | 'device_sound' | 'vibration_only' | 'silent';

export const NOTIFICATION_MODE_OPTIONS: { key: NotificationMode; label: string }[] = [
  { key: 'rebiid_sound', label: 'צליל REBIID' },
  { key: 'device_sound', label: 'בחירת צליל מהמכשיר' },
  { key: 'vibration_only', label: 'רטט בלבד' },
  { key: 'silent', label: 'התראה שקטה' },
];

/**
 * Versioned Android channel ids. Sound binding is immutable after first create —
 * bump the suffix when changing channel sound behavior.
 */
export const NOTIFICATION_CHANNEL_IDS = {
  rebiidSound: 'rebiid-sound-v3',
  deviceSound: 'rebiid-device-sound-v3',
  vibrationOnly: 'rebiid-vibration-v3',
  silent: 'rebiid-silent-v3',
} as const;

/** Bundled WAV basename registered via expo-notifications `sounds` in app.json. */
export const REBIID_GENTLE_SOUND = 'rebiid_gentle.wav';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = NOTIFICATION_CHANNEL_IDS.rebiidSound;

export function isNotificationMode(value: unknown): value is NotificationMode {
  return (
    value === 'rebiid_sound' ||
    value === 'device_sound' ||
    value === 'vibration_only' ||
    value === 'silent'
  );
}

/** Migrate legacy sound / vibration flags to the global notification mode. */
export function migrateNotificationMode(settings: Partial<AppSettings>): NotificationMode {
  if (isNotificationMode(settings.notificationMode)) {
    return settings.notificationMode;
  }

  const soundEnabled = settings.notificationSoundEnabled ?? true;
  const vibrationEnabled = settings.notificationVibrationEnabled ?? true;
  const sound = settings.notificationSound ?? 'default';

  if (!soundEnabled || sound === 'silent') {
    return vibrationEnabled ? 'vibration_only' : 'silent';
  }

  if (sound === 'classic' || sound === 'default') {
    return 'rebiid_sound';
  }

  if (sound === 'gentle') {
    return 'rebiid_sound';
  }

  return 'rebiid_sound';
}

/** Keep legacy fields in sync when persisting the global mode. */
export function legacyFieldsForNotificationMode(mode: NotificationMode): {
  notificationSoundEnabled: boolean;
  notificationVibrationEnabled: boolean;
  notificationSound: NotificationSound;
} {
  switch (mode) {
    case 'rebiid_sound':
      return {
        notificationSoundEnabled: true,
        notificationVibrationEnabled: true,
        notificationSound: 'gentle',
      };
    case 'device_sound':
      return {
        notificationSoundEnabled: true,
        notificationVibrationEnabled: true,
        notificationSound: 'default',
      };
    case 'vibration_only':
      return {
        notificationSoundEnabled: false,
        notificationVibrationEnabled: true,
        notificationSound: 'silent',
      };
    case 'silent':
    default:
      return {
        notificationSoundEnabled: false,
        notificationVibrationEnabled: false,
        notificationSound: 'silent',
      };
  }
}

export function resolveNotificationChannelIdForMode(mode: NotificationMode): string {
  switch (mode) {
    case 'rebiid_sound':
      return NOTIFICATION_CHANNEL_IDS.rebiidSound;
    case 'device_sound':
      return NOTIFICATION_CHANNEL_IDS.deviceSound;
    case 'vibration_only':
      return NOTIFICATION_CHANNEL_IDS.vibrationOnly;
    case 'silent':
    default:
      return NOTIFICATION_CHANNEL_IDS.silent;
  }
}

export function resolveNotificationChannelId(settings: AppSettings): string {
  const mode = resolveEffectiveNotificationMode(settings);
  return resolveNotificationChannelIdForMode(mode);
}

/**
 * Category delivery modes may further restrict sound/vibration, but never override
 * the global sound channel selection via legacy per-category sound prefs.
 */
export function resolveEffectiveNotificationMode(
  settings: AppSettings,
  categoryPreference?: NotificationCategoryPreference,
): NotificationMode {
  const globalMode = settings.notificationMode;

  if (!categoryPreference) {
    return globalMode;
  }

  switch (categoryPreference.deliveryMode) {
    case 'silent':
    case 'center_only':
      return 'silent';
    case 'vibration_only':
      return 'vibration_only';
    case 'sound_only':
      if (globalMode === 'vibration_only' || globalMode === 'silent') {
        return 'rebiid_sound';
      }
      return globalMode;
    case 'full':
    default:
      return globalMode;
  }
}

export function shouldPlaySoundForMode(mode: NotificationMode): boolean {
  return mode === 'rebiid_sound' || mode === 'device_sound';
}

export function shouldVibrateForMode(mode: NotificationMode): boolean {
  return mode === 'rebiid_sound' || mode === 'device_sound' || mode === 'vibration_only';
}

export function resolveContentSoundForMode(mode: NotificationMode): string | false {
  if (!shouldPlaySoundForMode(mode)) {
    return false;
  }

  if (mode === 'rebiid_sound') {
    return REBIID_GENTLE_SOUND;
  }

  return 'default';
}

export function vibrationPatternForMode(mode: NotificationMode): number[] {
  return shouldVibrateForMode(mode) ? [0, 250, 250, 250] : [0];
}
