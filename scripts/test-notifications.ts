/**
 * Notification mode routing, versioned channels, and reschedule regression checks.
 * Run: npm run test:notifications
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  ANDROID_CHANNEL_SOUND_NONE,
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  LEGACY_NOTIFICATION_CHANNEL_IDS,
  NOTIFICATION_CHANNEL_IDS,
  getAndroidNotificationDeliveryConfig,
  migrateNotificationMode,
  resolveContentSoundForMode,
  resolveNotificationChannelIdForMode,
  shouldPlaySoundForMode,
  shouldVibrateForMode,
  type NotificationMode,
} from '../lib/notificationMode';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✓ ${label}`);
}

const MODES: NotificationMode[] = ['device_sound', 'vibration_only', 'silent'];

assert(
  'no bundled custom notification sound asset',
  !fs.existsSync(path.resolve('assets/sounds/rebiid_gentle.wav')),
);

assert(
  'default channel is device sound channel',
  DEFAULT_NOTIFICATION_CHANNEL_ID === 'rebiid-device-sound-v3',
);

assert(
  'device mode routes to rebiid-device-sound-v3 with default sound',
  getAndroidNotificationDeliveryConfig('device_sound').channelId ===
    'rebiid-device-sound-v3' &&
    getAndroidNotificationDeliveryConfig('device_sound').channelSound === 'default' &&
    getAndroidNotificationDeliveryConfig('device_sound').contentSound === 'default' &&
    getAndroidNotificationDeliveryConfig('device_sound').createChannelOnlyIfMissing === true,
);

const vibrateCfg = getAndroidNotificationDeliveryConfig('vibration_only');
assert(
  'vibration-only routes to rebiid_vibrate_v3 with empty-string channel sound + vibrate',
  vibrateCfg.channelId === 'rebiid_vibrate_v3' &&
    vibrateCfg.channelSound === ANDROID_CHANNEL_SOUND_NONE &&
    vibrateCfg.channelSound === '' &&
    vibrateCfg.contentSound === false &&
    vibrateCfg.enableVibrate === true &&
    vibrateCfg.shouldPlaySound === false &&
    vibrateCfg.channelImportance === 'high' &&
    Array.isArray(vibrateCfg.vibrationPattern) &&
    vibrateCfg.vibrationPattern.length > 1 &&
    vibrateCfg.createChannelOnlyIfMissing === true,
);

assert(
  'silent routes to rebiid_silent_v3 with empty-string channel sound and no vibration',
  getAndroidNotificationDeliveryConfig('silent').channelId === 'rebiid_silent_v3' &&
    getAndroidNotificationDeliveryConfig('silent').channelSound === '' &&
    getAndroidNotificationDeliveryConfig('silent').contentSound === false &&
    getAndroidNotificationDeliveryConfig('silent').enableVibrate === false &&
    getAndroidNotificationDeliveryConfig('silent').shouldPlaySound === false &&
    getAndroidNotificationDeliveryConfig('silent').vibrationPattern.length === 0 &&
    getAndroidNotificationDeliveryConfig('silent').createChannelOnlyIfMissing === true,
);

assert(
  'vibrate/silent never use JS null channelSound (bridge omits null → Android default)',
  typeof vibrateCfg.channelSound === 'string' &&
    typeof getAndroidNotificationDeliveryConfig('silent').channelSound === 'string' &&
    vibrateCfg.channelSound !== 'default' &&
    getAndroidNotificationDeliveryConfig('silent').channelSound !== 'default',
);

assert(
  'all modes preserve user channel settings after first create',
  MODES.every((mode) => getAndroidNotificationDeliveryConfig(mode).createChannelOnlyIfMissing),
);

assert(
  'resolve helpers match getAndroidNotificationDeliveryConfig',
  MODES.every((mode) => {
    const config = getAndroidNotificationDeliveryConfig(mode);
    return (
      resolveNotificationChannelIdForMode(mode) === config.channelId &&
      resolveContentSoundForMode(mode) === config.contentSound &&
      shouldPlaySoundForMode(mode) === config.shouldPlaySound &&
      shouldVibrateForMode(mode) === config.enableVibrate
    );
  }),
);

assert(
  'no active mode routes to legacy channel ids',
  MODES.every(
    (mode) =>
      !(LEGACY_NOTIFICATION_CHANNEL_IDS as readonly string[]).includes(
        getAndroidNotificationDeliveryConfig(mode).channelId,
      ),
  ),
);

assert(
  'retired rebiid custom channel is legacy-only',
  (LEGACY_NOTIFICATION_CHANNEL_IDS as readonly string[]).includes('rebiid_custom_v3'),
);

assert(
  'legacy gentle migrates to device_sound',
  migrateNotificationMode({
    notificationSound: 'gentle',
    notificationSoundEnabled: true,
    notificationVibrationEnabled: true,
  }) === 'device_sound',
);

assert(
  'stored rebiid_sound migrates to device_sound',
  migrateNotificationMode({
    notificationMode: 'rebiid_sound' as never,
  }) === 'device_sound',
);

// --- Source routing ---
const notificationsSrc = fs.readFileSync(path.resolve('lib/notifications.ts'), 'utf8');
const channelsSrc = fs.readFileSync(path.resolve('lib/notificationChannels.ts'), 'utf8');
const modeSrc = fs.readFileSync(path.resolve('lib/notificationMode.ts'), 'utf8');
const diagSrc = fs.readFileSync(path.resolve('lib/notificationDiagnostics.ts'), 'utf8');

assert(
  'scheduleTestNotification reloads persisted settings via getAppSettings',
  notificationsSrc.includes('scheduleTestNotification') &&
    notificationsSrc.includes('const settings = await getAppSettings()') &&
    notificationsSrc.includes('buildNotificationContent') &&
    notificationsSrc.includes('delivery.channelId'),
);

assert(
  'scheduled reminders use resolveCategoryAndroidChannelId + buildCategoryNotificationContent',
  notificationsSrc.includes('resolveCategoryAndroidChannelId') &&
    notificationsSrc.includes('buildCategoryNotificationContent'),
);

assert(
  'channel ensure logs payload and uses config.channelSound string',
  channelsSrc.includes('logChannelEnsurePayload') &&
    channelsSrc.includes('sound: config.channelSound'),
);

assert(
  'diagnostics inspect all three device channels via getNotificationChannelAsync',
  diagSrc.includes('getNotificationChannelAsync') &&
    diagSrc.includes('inspectAllAndroidNotificationChannels') &&
    !diagSrc.includes('rebiidSound'),
);

assert(
  'mode change reschedules via selective reconcile (not cancelAll)',
  notificationsSrc.includes('rescheduleNotificationsAfterSettingsChange') &&
    notificationsSrc.includes('reconcileScheduledNotifications') &&
    notificationsSrc.includes('getAllScheduledNotificationsAsync') &&
    !notificationsSrc.includes('cancelAllScheduledNotificationsAsync'),
);

assert(
  'foreground handler uses shouldForegroundPlaySound (false for vibrate/silent)',
  notificationsSrc.includes('shouldPlaySound: shouldForegroundPlaySound(currentAppSettings)') &&
    !shouldPlaySoundForMode('vibration_only') &&
    !shouldPlaySoundForMode('silent'),
);

assert(
  'no schedule path uses retired custom channel id',
  !notificationsSrc.includes('rebiid_custom_v3') &&
    !notificationsSrc.includes('rebiid-sound-v3') &&
    NOTIFICATION_CHANNEL_IDS.vibrationOnly === 'rebiid_vibrate_v3',
);

assert(
  'no bundled rebiid_gentle references in notification mode source',
  !modeSrc.includes('rebiid_gentle'),
);

assert(
  'mode source documents empty-string no-sound bridge fix',
  modeSrc.includes("ANDROID_CHANNEL_SOUND_NONE = ''") &&
    modeSrc.includes('Do NOT use JS `null`'),
);

const appJson = JSON.parse(
  fs.readFileSync(path.resolve('app.json'), 'utf8').replace(/^\uFEFF/, ''),
) as {
  expo: {
    extra?: { supportsRTL?: boolean; forcesRTL?: boolean };
    plugins: unknown[];
  };
};

const notificationsPlugin = appJson.expo.plugins.find(
  (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-notifications',
) as [string, { defaultChannel?: string; sounds?: string[] }] | undefined;

assert(
  'app.json defaultChannel is rebiid-device-sound-v3',
  notificationsPlugin?.[1]?.defaultChannel === NOTIFICATION_CHANNEL_IDS.deviceSound,
);

assert(
  'app.json does not bundle custom notification sounds',
  !notificationsPlugin?.[1]?.sounds?.length,
);

assert('app.json supportsRTL', appJson.expo.extra?.supportsRTL === true);
assert('app.json forcesRTL', appJson.expo.extra?.forcesRTL === true);

// --- Android icon configuration resolves to existing safe-zone assets ---
const expo = appJson.expo as {
  icon?: string;
  android?: {
    adaptiveIcon?: {
      foregroundImage?: string;
      backgroundImage?: string;
      monochromeImage?: string;
      backgroundColor?: string;
    };
  };
  plugins: unknown[];
};

function resolveAsset(rel: string | undefined): string | null {
  if (!rel) return null;
  const abs = path.resolve(rel.replace(/^\.\//, ''));
  return fs.existsSync(abs) ? abs : null;
}

assert(
  'general icon resolves to existing icon-v2.png',
  expo.icon === './assets/images/icon-v2.png' && resolveAsset(expo.icon) !== null,
);

assert(
  'Android adaptive foreground resolves to existing foreground-v2.png',
  expo.android?.adaptiveIcon?.foregroundImage ===
    './assets/images/android-icon-foreground-v2.png' &&
    resolveAsset(expo.android?.adaptiveIcon?.foregroundImage) !== null,
);

assert(
  'Android adaptive background + monochrome assets exist',
  resolveAsset(expo.android?.adaptiveIcon?.backgroundImage) !== null &&
    resolveAsset(expo.android?.adaptiveIcon?.monochromeImage) !== null &&
    typeof expo.android?.adaptiveIcon?.backgroundColor === 'string',
);

assert(
  'adaptive foreground-v2 has transparent corners (safe-zone asset)',
  (() => {
    const abs = resolveAsset(expo.android?.adaptiveIcon?.foregroundImage);
    if (!abs) return false;
    const buf = fs.readFileSync(abs);
    return buf.readUInt32BE(16) === 1024 && buf.readUInt32BE(20) === 1024 && buf[25] === 6;
  })(),
);

assert(
  'diagnostics gated to __DEV__ (not always-on in production)',
  diagSrc.includes('NOTIFICATION_DIAGNOSTICS_ENABLED = typeof __DEV__') ||
    diagSrc.includes('NOTIFICATION_DIAGNOSTICS_ENABLED = __DEV__'),
);

assert(
  'silent has empty vibration pattern and no sound',
  getAndroidNotificationDeliveryConfig('silent').vibrationPattern.length === 0 &&
    getAndroidNotificationDeliveryConfig('silent').channelSound === '' &&
    getAndroidNotificationDeliveryConfig('silent').contentSound === false,
);

console.log('All notification routing checks passed.');
