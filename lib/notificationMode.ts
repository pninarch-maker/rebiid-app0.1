import type { NotificationCategoryPreference } from './notificationCategories';
import type { AppSettings, NotificationSound } from './settingsTypes';

/**
 * Global notification delivery mode — mutually exclusive.
 * All modes route through Android notification channels; sound/vibration/silence
 * are configured on the device via channel settings (no bundled custom sound).
 */
export type NotificationMode = 'device_sound' | 'vibration_only' | 'silent';

export const NOTIFICATION_MODE_OPTIONS: { key: NotificationMode; label: string }[] = [
  { key: 'device_sound', label: 'צליל מהמכשיר' },
  { key: 'vibration_only', label: 'רטט בלבד' },
  { key: 'silent', label: 'התראה שקטה' },
];

/**
 * Versioned Android channel ids. Sound/vibration bindings are immutable after first
 * create — bump when changing channel delivery behavior.
 *
 * Channels are created once if missing; thereafter the user configures delivery
 * in Android notification channel settings.
 */
export const NOTIFICATION_CHANNEL_IDS = {
  deviceSound: 'rebiid-device-sound-v3',
  vibrationOnly: 'rebiid_vibrate_v3',
  silent: 'rebiid_silent_v3',
} as const;

/** Retired channel ids — must never be used for newly scheduled notifications. */
export const LEGACY_NOTIFICATION_CHANNEL_IDS = [
  'rebiid_custom_v3',
  'rebiid-sound-v3',
  'rebiid-vibration-v3',
  'rebiid-silent-v3',
  'rebiid-sound-v2',
  'rebiid-vibration-v2',
  'rebiid-silent-v2',
  'rebiid_custom_v2',
  'rebiid_vibrate_v2',
  'rebiid_silent_v2',
] as const;

export const DEFAULT_NOTIFICATION_CHANNEL_ID = NOTIFICATION_CHANNEL_IDS.deviceSound;

const DEFAULT_VIBRATION_PATTERN = [0, 250, 250, 250];

/**
 * Single source of truth for Android (and content) delivery routing.
 * Test notifications and scheduled reminders must both use this function.
 */
export type AndroidNotificationDeliveryConfig = {
  channelId: string;
  /** Notification content `sound` (pre-Oreo + content metadata). */
  contentSound: string | false;
  /**
   * Channel creation sound.
   *
   * IMPORTANT (expo-notifications Android):
   * - Do NOT use JS `null` — Expo may omit null fields when bridging, so
   *   `containsKey("sound")` is false and Android keeps the SYSTEM DEFAULT sound.
   * - Use empty string `''` for no sound. Native SoundResolver treats '' as null URI
   *   and `createSoundUriFromArguments` then calls `channel.setSound(null, ...)`.
   * - `'default'` uses the device default notification sound.
   */
  channelSound: string;
  enableVibrate: boolean;
  vibrationPattern: number[];
  shouldPlaySound: boolean;
  channelImportance: 'high' | 'default';
  /**
   * When true, only create the channel if missing — never call
   * setNotificationChannelAsync with a sound that would fight a user-selected ringtone.
   */
  createChannelOnlyIfMissing: boolean;
};

/** Explicit no-sound marker for Android channel create (must not be JS null). */
export const ANDROID_CHANNEL_SOUND_NONE = '';

export function getAndroidNotificationDeliveryConfig(
  mode: NotificationMode,
): AndroidNotificationDeliveryConfig {
  switch (mode) {
    case 'device_sound':
      return {
        channelId: NOTIFICATION_CHANNEL_IDS.deviceSound,
        contentSound: 'default',
        channelSound: 'default',
        enableVibrate: true,
        vibrationPattern: DEFAULT_VIBRATION_PATTERN,
        shouldPlaySound: true,
        channelImportance: 'high',
        createChannelOnlyIfMissing: true,
      };
    case 'vibration_only':
      return {
        channelId: NOTIFICATION_CHANNEL_IDS.vibrationOnly,
        contentSound: false,
        channelSound: ANDROID_CHANNEL_SOUND_NONE,
        enableVibrate: true,
        vibrationPattern: DEFAULT_VIBRATION_PATTERN,
        shouldPlaySound: false,
        channelImportance: 'high',
        createChannelOnlyIfMissing: true,
      };
    case 'silent':
    default:
      return {
        channelId: NOTIFICATION_CHANNEL_IDS.silent,
        contentSound: false,
        channelSound: ANDROID_CHANNEL_SOUND_NONE,
        enableVibrate: false,
        vibrationPattern: [],
        shouldPlaySound: false,
        channelImportance: 'default',
        createChannelOnlyIfMissing: true,
      };
  }
}

export function isNotificationMode(value: unknown): value is NotificationMode {
  return value === 'device_sound' || value === 'vibration_only' || value === 'silent';
}

/** Migrate legacy sound / vibration flags and retired modes to device channels. */
export function migrateNotificationMode(settings: Partial<AppSettings>): NotificationMode {
  const stored = settings.notificationMode as string | undefined;
  if (stored === 'rebiid_sound') {
    return 'device_sound';
  }
  if (isNotificationMode(stored)) {
    return stored;
  }

  const soundEnabled = settings.notificationSoundEnabled ?? true;
  const vibrationEnabled = settings.notificationVibrationEnabled ?? true;
  const sound = settings.notificationSound ?? 'default';

  if (!soundEnabled || sound === 'silent') {
    return vibrationEnabled ? 'vibration_only' : 'silent';
  }

  return 'device_sound';
}

/** Keep legacy fields in sync when persisting the global mode. */
export function legacyFieldsForNotificationMode(mode: NotificationMode): {
  notificationSoundEnabled: boolean;
  notificationVibrationEnabled: boolean;
  notificationSound: NotificationSound;
} {
  switch (mode) {
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
  return getAndroidNotificationDeliveryConfig(mode).channelId;
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
        return 'device_sound';
      }
      return globalMode;
    case 'full':
    default:
      return globalMode;
  }
}

export function shouldPlaySoundForMode(mode: NotificationMode): boolean {
  return getAndroidNotificationDeliveryConfig(mode).shouldPlaySound;
}

export function shouldVibrateForMode(mode: NotificationMode): boolean {
  return getAndroidNotificationDeliveryConfig(mode).enableVibrate;
}

export function resolveContentSoundForMode(mode: NotificationMode): string | false {
  return getAndroidNotificationDeliveryConfig(mode).contentSound;
}

export function vibrationPatternForMode(mode: NotificationMode): number[] {
  return getAndroidNotificationDeliveryConfig(mode).vibrationPattern;
}
