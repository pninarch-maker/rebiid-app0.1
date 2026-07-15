import type { AppReminder } from '@/src/engine/reminders/types';
import type { UpcomingReminder } from '@/src/engine/types';

import {
  NOTIFICATION_CATEGORY_DEFINITIONS,
  NOTIFICATION_CATEGORY_ORDER,
  type AdvanceReminderMinutes,
  type NotificationCategoryId,
  type NotificationCategoryPreference,
  type NotificationDeliveryMode,
  resolveNotificationCategoryIdForReminder,
  resolveNotificationCategoryIdForRule,
} from './notificationCategories';
import type { AppSettings, NotificationSound } from './settingsTypes';

export type NotificationCategoryPreferences = Record<
  NotificationCategoryId,
  NotificationCategoryPreference
>;

export const DELIVERY_MODE_OPTIONS: { key: NotificationDeliveryMode; label: string }[] = [
  { key: 'full', label: 'התראה מלאה' },
  { key: 'silent', label: 'התראה שקטה' },
  { key: 'center_only', label: 'מרכז ההתראות בלבד' },
  { key: 'vibration_only', label: 'רטט בלבד' },
  { key: 'sound_only', label: 'צליל בלבד' },
  { key: 'disabled', label: 'כבוי' },
];

export const ADVANCE_REMINDER_OPTIONS: { key: AdvanceReminderMinutes; label: string }[] = [
  { key: 0, label: 'בזמן האירוע' },
  { key: 5, label: '5 דקות' },
  { key: 15, label: '15 דקות' },
  { key: 30, label: '30 דקות' },
  { key: 60, label: 'שעה' },
  { key: 1440, label: 'יום' },
];

export const CATEGORY_SOUND_OPTIONS: { key: NotificationSound; label: string }[] = [
  { key: 'default', label: 'ברירת מחדל' },
  { key: 'gentle', label: 'צליל עדין' },
  { key: 'classic', label: 'קלאסי' },
  { key: 'silent', label: 'שקט' },
];

export function createDefaultCategoryPreference(
  options: {
    notificationSound?: NotificationSound;
    notificationVibrationEnabled?: boolean;
    defaultReminderOffsetMinutes?: number;
  } = {},
): NotificationCategoryPreference {
  return {
    enabled: true,
    deliveryMode: 'full',
    sound: options.notificationSound ?? 'default',
    vibrationEnabled: options.notificationVibrationEnabled ?? true,
    showOnHome: true,
    advanceReminderMinutes: normalizeAdvanceMinutes(options.defaultReminderOffsetMinutes ?? 60),
  };
}

export function createDefaultNotificationCategoryPreferences(
  options: {
    notificationSound?: NotificationSound;
    notificationVibrationEnabled?: boolean;
    defaultReminderOffsetMinutes?: number;
  } = {},
): NotificationCategoryPreferences {
  const defaults = {} as NotificationCategoryPreferences;
  for (const id of NOTIFICATION_CATEGORY_ORDER) {
    defaults[id] = createDefaultCategoryPreference(options);
  }
  return defaults;
}

export function normalizeNotificationCategoryPreferences(
  raw: Partial<Record<NotificationCategoryId, Partial<NotificationCategoryPreference>>> | undefined,
  options: {
    notificationSound?: NotificationSound;
    notificationVibrationEnabled?: boolean;
    defaultReminderOffsetMinutes?: number;
  } = {},
): NotificationCategoryPreferences {
  const defaults = createDefaultNotificationCategoryPreferences(options);
  const normalized = { ...defaults };

  for (const id of NOTIFICATION_CATEGORY_ORDER) {
    const value = raw?.[id];
    if (!value) {
      continue;
    }

    normalized[id] = {
      enabled: value.enabled ?? defaults[id].enabled,
      deliveryMode: isDeliveryMode(value.deliveryMode) ? value.deliveryMode : defaults[id].deliveryMode,
      sound: isNotificationSound(value.sound) ? value.sound : defaults[id].sound,
      vibrationEnabled: value.vibrationEnabled ?? defaults[id].vibrationEnabled,
      showOnHome: value.showOnHome ?? defaults[id].showOnHome,
      advanceReminderMinutes: normalizeAdvanceMinutes(
        value.advanceReminderMinutes ?? defaults[id].advanceReminderMinutes,
      ),
    };
  }

  return normalized;
}

function normalizeAdvanceMinutes(minutes: number): AdvanceReminderMinutes {
  if (minutes === 5 || minutes === 15 || minutes === 30 || minutes === 60 || minutes === 1440) {
    return minutes;
  }
  if (minutes === 0) {
    return 0;
  }
  if (minutes <= 5) {
    return 5;
  }
  if (minutes <= 15) {
    return 15;
  }
  if (minutes <= 30) {
    return 30;
  }
  if (minutes <= 60) {
    return 60;
  }
  return 1440;
}

function isDeliveryMode(value: unknown): value is NotificationDeliveryMode {
  return (
    value === 'full' ||
    value === 'silent' ||
    value === 'center_only' ||
    value === 'vibration_only' ||
    value === 'sound_only' ||
    value === 'disabled'
  );
}

function isNotificationSound(value: unknown): value is NotificationSound {
  return value === 'default' || value === 'gentle' || value === 'classic' || value === 'silent';
}

export function getNotificationCategoryPreference(
  settings: AppSettings,
  categoryId: NotificationCategoryId,
): NotificationCategoryPreference {
  return settings.notificationCategoryPreferences[categoryId];
}

export function getNotificationCategoryPreferenceForReminder(
  reminder: Pick<AppReminder, 'category' | 'ruleId' | 'source'>,
  settings: AppSettings,
): NotificationCategoryPreference {
  const categoryId = resolveNotificationCategoryIdForReminder(reminder);
  return getNotificationCategoryPreference(settings, categoryId);
}

export function isNotificationCategoryEnabledForReminder(
  reminder: Pick<AppReminder, 'category' | 'ruleId' | 'source'>,
  settings: AppSettings,
): boolean {
  const pref = getNotificationCategoryPreferenceForReminder(reminder, settings);
  if (!pref.enabled || pref.deliveryMode === 'disabled') {
    return false;
  }

  const definition = NOTIFICATION_CATEGORY_DEFINITIONS.find(
    (item) => item.id === resolveNotificationCategoryIdForReminder(reminder),
  );
  if (definition?.knowledgeOnly) {
    return false;
  }

  return true;
}

export function shouldShowCategoryOnHome(
  categoryId: NotificationCategoryId,
  settings: AppSettings,
): boolean {
  const pref = getNotificationCategoryPreference(settings, categoryId);
  return pref.enabled && pref.showOnHome;
}

export function shouldScheduleReminderNotification(
  reminder: UpcomingReminder,
  settings: AppSettings,
): boolean {
  if (!settings.notificationsEnabled) {
    return false;
  }

  return isNotificationCategoryEnabledForReminder(reminder, settings);
}

export function isBuiltInRuleAllowedByCategoryPreferences(
  rule: Parameters<typeof resolveNotificationCategoryIdForRule>[0],
  settings: AppSettings,
): boolean {
  const categoryId = resolveNotificationCategoryIdForRule(rule);
  const pref = settings.notificationCategoryPreferences[categoryId];

  if (!pref?.enabled || pref.deliveryMode === 'disabled') {
    return false;
  }

  const definition = NOTIFICATION_CATEGORY_DEFINITIONS.find((item) => item.id === categoryId);
  if (definition?.knowledgeOnly) {
    return false;
  }

  return true;
}
