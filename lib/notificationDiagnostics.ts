import { Platform } from 'react-native';

import { getNotificationChannelAsync } from '@/lib/localNotifications';
import {
  NOTIFICATION_CHANNEL_IDS,
  getAndroidNotificationDeliveryConfig,
  type AndroidNotificationDeliveryConfig,
  type NotificationMode,
} from '@/lib/notificationMode';

/**
 * Notification route diagnostics.
 * Enabled only in development builds — never noisy in production/standalone APKs.
 */
export const NOTIFICATION_DIAGNOSTICS_ENABLED = typeof __DEV__ !== 'undefined' && __DEV__;

export type NotificationScheduleKind =
  | 'test'
  | 'scheduled'
  | 'category'
  | 'rescheduled';

export type NotificationScheduleDiagnostic = {
  kind: NotificationScheduleKind;
  persistedMode: NotificationMode;
  delivery: AndroidNotificationDeliveryConfig;
  identifier: string | null;
  contentSound: string | false | undefined;
  triggerChannelId: string | null;
};

export type AndroidChannelSnapshot = {
  channelId: string;
  exists: boolean;
  sound: string | null;
  importance: number | null;
  enableVibrate: boolean | null;
  vibrationPattern: number[] | null;
  name: string | null;
};

function redactNotificationIdentifier(identifier: string | null): string | null {
  if (!identifier) {
    return null;
  }

  const personalMatch = identifier.match(/^\d{4}-\d{2}-\d{2}-personal-(.+)$/);
  if (personalMatch) {
    return `personal:${personalMatch[1].slice(0, 8)}`;
  }

  const builtInMatch = identifier.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  if (builtInMatch) {
    return builtInMatch[1];
  }

  return 'unknown';
}

function logDiagnostic(label: string, payload: unknown): void {
  if (!NOTIFICATION_DIAGNOSTICS_ENABLED) {
    return;
  }
  console.warn(`[REBIID notify diag] ${label}`, JSON.stringify(payload, null, 2));
}

export function logNotificationScheduleDiagnostic(
  diagnostic: NotificationScheduleDiagnostic,
): void {
  logDiagnostic('schedule', {
    ...diagnostic,
    identifier: redactNotificationIdentifier(diagnostic.identifier),
  });
}

export async function inspectAndroidNotificationChannel(
  channelId: string,
): Promise<AndroidChannelSnapshot> {
  if (Platform.OS !== 'android') {
    return {
      channelId,
      exists: false,
      sound: null,
      importance: null,
      enableVibrate: null,
      vibrationPattern: null,
      name: null,
    };
  }

  try {
    const channel = await getNotificationChannelAsync(channelId);
    if (!channel) {
      return {
        channelId,
        exists: false,
        sound: null,
        importance: null,
        enableVibrate: null,
        vibrationPattern: null,
        name: null,
      };
    }

    return {
      channelId,
      exists: true,
      sound: channel.sound ?? null,
      importance: channel.importance ?? null,
      enableVibrate: channel.enableVibrate ?? null,
      vibrationPattern: channel.vibrationPattern ? [...channel.vibrationPattern] : null,
      name: channel.name ?? null,
    };
  } catch (error) {
    logDiagnostic('inspectChannel failed', { channelId, error: String(error) });
    return {
      channelId,
      exists: false,
      sound: null,
      importance: null,
      enableVibrate: null,
      vibrationPattern: null,
      name: null,
    };
  }
}

/** Inspect custom / device / vibrate / silent channels after ensure. */
export async function inspectAllAndroidNotificationChannels(): Promise<
  AndroidChannelSnapshot[]
> {
  const ids = [
    NOTIFICATION_CHANNEL_IDS.deviceSound,
    NOTIFICATION_CHANNEL_IDS.vibrationOnly,
    NOTIFICATION_CHANNEL_IDS.silent,
  ];

  const snapshots: AndroidChannelSnapshot[] = [];
  for (const channelId of ids) {
    const snapshot = await inspectAndroidNotificationChannel(channelId);
    snapshots.push(snapshot);
    logDiagnostic('channelSnapshot', snapshot);
  }
  return snapshots;
}

export function formatChannelSnapshotsForAlert(
  mode: NotificationMode,
  snapshots: AndroidChannelSnapshot[],
): string {
  const expected = getAndroidNotificationDeliveryConfig(mode);
  const lines = [
    `mode=${mode}`,
    `expectedChannel=${expected.channelId}`,
    `expectedChannelSound=${JSON.stringify(expected.channelSound)}`,
    `expectedContentSound=${JSON.stringify(expected.contentSound)}`,
    '',
    ...snapshots.map((s) => {
      if (!s.exists) {
        return `${s.channelId}: MISSING`;
      }
      return (
        `${s.channelId}:` +
        `\n  sound=${s.sound}` +
        `\n  vibrate=${s.enableVibrate}` +
        `\n  importance=${s.importance}` +
        `\n  pattern=${JSON.stringify(s.vibrationPattern)}`
      );
    }),
  ];
  return lines.join('\n');
}

export function logChannelEnsurePayload(
  mode: NotificationMode,
  payload: {
    channelId: string;
    sound: string | null;
    enableVibrate: boolean;
    vibrationPattern: number[];
    importance: string;
  },
): void {
  logDiagnostic('setNotificationChannelAsync payload', { mode, ...payload });
}
