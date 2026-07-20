import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

import { NOTIFICATION_CHANNEL_IDS, type NotificationMode } from './notificationMode';

const ANDROID_PACKAGE = 'com.rebiid.app';

function channelIdForMode(mode: NotificationMode): string {
  switch (mode) {
    case 'device_sound':
      return NOTIFICATION_CHANNEL_IDS.deviceSound;
    case 'rebiid_sound':
      return NOTIFICATION_CHANNEL_IDS.rebiidSound;
    case 'vibration_only':
      return NOTIFICATION_CHANNEL_IDS.vibrationOnly;
    case 'silent':
    default:
      return NOTIFICATION_CHANNEL_IDS.silent;
  }
}

/** Opens Android notification-channel settings for the given mode, with app-settings fallback. */
export async function openAndroidNotificationChannelSettings(
  mode: NotificationMode = 'device_sound',
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const channelId = channelIdForMode(mode);

  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.CHANNEL_NOTIFICATION_SETTINGS' as IntentLauncher.ActivityAction,
      {
        extra: {
          'android.provider.extra.APP_PACKAGE': ANDROID_PACKAGE,
          'android.provider.extra.CHANNEL_ID': channelId,
        },
      },
    );
    return true;
  } catch (error) {
    console.warn('[notifications] channel settings intent failed', error);
  }

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
      {
        extra: {
          'android.provider.extra.APP_PACKAGE': ANDROID_PACKAGE,
        },
      },
    );
    return true;
  } catch (error) {
    console.warn('[notifications] app notification settings intent failed', error);
  }

  try {
    await Linking.openSettings();
    return true;
  } catch (error) {
    console.warn('[notifications] openSettings failed', error);
    return false;
  }
}
