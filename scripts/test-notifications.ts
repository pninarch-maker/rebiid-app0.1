/**
 * Notification mode, channel IDs, bundled sound, and RTL config regression checks.
 * Run: npm run test:notifications
 */
import fs from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_IDS,
  REBIID_GENTLE_SOUND,
  migrateNotificationMode,
  resolveContentSoundForMode,
  resolveNotificationChannelIdForMode,
  shouldPlaySoundForMode,
  shouldVibrateForMode,
} from '../lib/notificationMode';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✓ ${label}`);
}

assert('default channel is rebiid-sound-v3', DEFAULT_NOTIFICATION_CHANNEL_ID === 'rebiid-sound-v3');

assert('rebiid_sound channel mapping', resolveNotificationChannelIdForMode('rebiid_sound') === 'rebiid-sound-v3');
assert('device_sound channel mapping', resolveNotificationChannelIdForMode('device_sound') === 'rebiid-device-sound-v3');
assert('vibration_only channel mapping', resolveNotificationChannelIdForMode('vibration_only') === 'rebiid-vibration-v3');
assert('silent channel mapping', resolveNotificationChannelIdForMode('silent') === 'rebiid-silent-v3');

assert('rebiid_sound plays bundled wav', resolveContentSoundForMode('rebiid_sound') === REBIID_GENTLE_SOUND);
assert('device_sound uses default', resolveContentSoundForMode('device_sound') === 'default');
assert('vibration_only has no content sound', resolveContentSoundForMode('vibration_only') === false);
assert('silent has no content sound', resolveContentSoundForMode('silent') === false);

assert('rebiid_sound should play sound', shouldPlaySoundForMode('rebiid_sound'));
assert('device_sound should play sound', shouldPlaySoundForMode('device_sound'));
assert('vibration_only should not play sound', !shouldPlaySoundForMode('vibration_only'));
assert('silent should not play sound', !shouldPlaySoundForMode('silent'));

assert('vibration_only should vibrate', shouldVibrateForMode('vibration_only'));
assert('silent should not vibrate', !shouldVibrateForMode('silent'));

assert(
  'legacy gentle migrates to rebiid_sound',
  migrateNotificationMode({
    notificationSound: 'gentle',
    notificationSoundEnabled: true,
    notificationVibrationEnabled: true,
  }) === 'rebiid_sound',
);

assert(
  'legacy silent + vibration migrates to vibration_only',
  migrateNotificationMode({
    notificationSound: 'silent',
    notificationSoundEnabled: false,
    notificationVibrationEnabled: true,
  }) === 'vibration_only',
);

assert(
  'legacy silent without vibration migrates to silent',
  migrateNotificationMode({
    notificationSound: 'silent',
    notificationSoundEnabled: false,
    notificationVibrationEnabled: false,
  }) === 'silent',
);

assert('bundled sound file exists', fs.existsSync(path.resolve('assets/sounds/rebiid_gentle.wav')));

const appJson = JSON.parse(fs.readFileSync(path.resolve('app.json'), 'utf8')) as {
  expo: {
    extra?: { supportsRTL?: boolean; forcesRTL?: boolean };
    plugins: unknown[];
  };
};
assert('app.json supportsRTL', appJson.expo.extra?.supportsRTL === true);
assert('app.json forcesRTL', appJson.expo.extra?.forcesRTL === true);
assert(
  'app.json defaultChannel',
  appJson.expo.plugins.some(
    (plugin: unknown) =>
      Array.isArray(plugin) &&
      plugin[0] === 'expo-notifications' &&
      (plugin[1] as { defaultChannel?: string })?.defaultChannel === NOTIFICATION_CHANNEL_IDS.rebiidSound,
  ),
);
assert(
  'app.json notification sounds include bundled wav',
  appJson.expo.plugins.some(
    (plugin: unknown) =>
      Array.isArray(plugin) &&
      plugin[0] === 'expo-notifications' &&
      (plugin[1] as { sounds?: string[] })?.sounds?.includes('./assets/sounds/rebiid_gentle.wav'),
  ),
);

console.log('All notification and RTL config checks passed.');
