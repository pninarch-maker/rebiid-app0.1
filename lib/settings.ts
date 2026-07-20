import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCityByName } from '@/src/data/israeliCities';
import { DEFAULT_DISABLED_RULE_IDS } from '@/src/data/reminders';
import {
  BUILT_IN_REMINDER_TOGGLE_GROUPS,
  DEFAULT_ENABLED_CATEGORIES,
  type BuiltInReminderToggleGroupId,
  type ReminderCategory,
  type ReminderEngineSettings,
  type SettingsMinhag,
} from '@/src/engine/reminders/types';
import { getDefaultReminderEngineSettings } from '@/src/engine/reminders/defaultSettings';

import { setCurrentAppSettings, currentAppSettings } from './appState';
import { normalizeAppearancePreference } from './appearancePreference';
import { NOTIFICATION_CATEGORY_DEFINITIONS } from './notificationCategories';
import { normalizeNotificationCategoryPreferences } from './notificationCategoryPrefs';
import {
  legacyFieldsForNotificationMode,
  migrateNotificationMode,
} from './notificationMode';
import type {
  AppSettings,
  NotificationCategoryPreferences,
  AddressGender,
  CustomReminder,
  ZmanimCalculationProfile,
} from './settingsTypes';
import {
  DEFAULT_APP_SETTINGS,
  USE_DEFAULT_REMINDER_OFFSET,
} from './settingsTypes';

const SETTINGS_KEY = '@luach/app-settings-v2';
const FIRST_LAUNCH_KEY = '@luach/first-launch-done';

const LEGACY_NOTIFICATIONS_KEY = '@luach/notifications-enabled';
const LEGACY_CITY_KEY = '@luach/city';
const LEGACY_HAVDALAH_KEY = '@luach/havdalah-method';
const LEGACY_PERSONAL_KEY = '@luach/personal-reminders';

export let currentReminderSettings: ReminderEngineSettings = getDefaultReminderEngineSettings();

export { currentAppSettings };

export async function getAppSettings(): Promise<AppSettings> {
  const stored = await AsyncStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return normalizeAppSettings(JSON.parse(stored) as Partial<AppSettings>);
    } catch {
      return { ...DEFAULT_APP_SETTINGS };
    }
  }

  return migrateLegacySettings();
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const normalized = normalizeAppSettings(settings);
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  } catch {
    throw new Error('storage');
  }
  setCurrentAppSettings(normalized);
  syncReminderEngineFromAppSettings(normalized);
  await syncEngineCategoriesFromNotificationPreferences(normalized.notificationCategoryPreferences);
  await persistReminderEngineSettings(currentReminderSettings);
}

export async function updateAppSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getAppSettings();
  const next = normalizeAppSettings({ ...current, ...partial });
  await saveAppSettings(next);
  return next;
}

function normalizeAppSettings(settings: Partial<AppSettings>): AppSettings {
  const cityRecord = getCityByName(settings.city ?? DEFAULT_APP_SETTINGS.city);
  const notificationMode = migrateNotificationMode(settings);
  const legacyNotification = legacyFieldsForNotificationMode(notificationMode);

  return {
    city: cityRecord.name,
    latitude: settings.latitude ?? cityRecord.latitude,
    longitude: settings.longitude ?? cityRecord.longitude,
    timezone: settings.timezone ?? cityRecord.timezone,
    candleLightingOffsetMinutes:
      settings.candleLightingOffsetMinutes ?? DEFAULT_APP_SETTINGS.candleLightingOffsetMinutes,
    havdalahMethod:
      settings.havdalahMethod === 'rabbeinu_tam' ? 'rabbeinu_tam' : 'regular',
    notificationsEnabled: settings.notificationsEnabled ?? DEFAULT_APP_SETTINGS.notificationsEnabled,
    defaultReminderOffsetMinutes:
      settings.defaultReminderOffsetMinutes ?? DEFAULT_APP_SETTINGS.defaultReminderOffsetMinutes,
    customReminders: Array.isArray(settings.customReminders)
      ? settings.customReminders.map(normalizeCustomReminder)
      : [],
    notificationMode,
    notificationSoundEnabled: legacyNotification.notificationSoundEnabled,
    notificationVibrationEnabled: legacyNotification.notificationVibrationEnabled,
    notificationSound: legacyNotification.notificationSound,
    notificationCategoryPreferences: normalizeNotificationCategoryPreferences(
      settings.notificationCategoryPreferences,
      {
        notificationSound: legacyNotification.notificationSound,
        notificationVibrationEnabled: legacyNotification.notificationVibrationEnabled,
        defaultReminderOffsetMinutes:
          settings.defaultReminderOffsetMinutes ?? DEFAULT_APP_SETTINGS.defaultReminderOffsetMinutes,
      },
    ),
    zmanimProfile: normalizeZmanimProfile(settings.zmanimProfile),
    addressGender: normalizeAddressGender(settings.addressGender),
    appearancePreference: normalizeAppearancePreference(settings.appearancePreference),
  };
}

function normalizeAddressGender(value: unknown): AddressGender {
  if (value === 'female' || value === 'unspecified') {
    return value;
  }
  return 'male';
}

function normalizeZmanimProfile(value: unknown): ZmanimCalculationProfile {
  if (value === 'magen_avraham') {
    return 'magen_avraham';
  }
  return 'gra';
}

function normalizeCustomReminder(reminder: CustomReminder): CustomReminder {
  return {
    id: reminder.id,
    title: reminder.title.trim(),
    message: reminder.message.trim(),
    hebrewMonth: reminder.hebrewMonth,
    hebrewDay: reminder.hebrewDay,
    time: reminder.time || '09:00',
    enabled: reminder.enabled,
    reminderOffsetMinutes:
      typeof reminder.reminderOffsetMinutes === 'number'
        ? reminder.reminderOffsetMinutes
        : USE_DEFAULT_REMINDER_OFFSET,
    category: reminder.category === 'minhag_segulah' ? 'minhag_segulah' : 'personal',
  };
}

async function migrateLegacySettings(): Promise<AppSettings> {
  const [notifications, cityKey, havdalah, personalRaw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_NOTIFICATIONS_KEY),
    AsyncStorage.getItem(LEGACY_CITY_KEY),
    AsyncStorage.getItem(LEGACY_HAVDALAH_KEY),
    AsyncStorage.getItem(LEGACY_PERSONAL_KEY),
  ]);

  const legacyCityName =
    cityKey === 'tel-aviv' ? 'תל אביב' : DEFAULT_APP_SETTINGS.city;
  const city = getCityByName(legacyCityName);

  let customReminders: CustomReminder[] = [];
  if (personalRaw) {
    try {
      const legacy = JSON.parse(personalRaw) as {
        id: string;
        title: string;
        message: string;
        hebrewMonth: string;
        hebrewDay: number;
        time?: string;
        enabled: boolean;
        notifyDaysBefore?: number;
        reminderOffsetMinutes?: number;
      }[];
      customReminders = legacy.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        hebrewMonth: item.hebrewMonth,
        hebrewDay: item.hebrewDay,
        time: item.time ?? '09:00',
        enabled: item.enabled,
        reminderOffsetMinutes:
          item.reminderOffsetMinutes ??
          (item.notifyDaysBefore && item.notifyDaysBefore > 0
            ? item.notifyDaysBefore * 1440
            : USE_DEFAULT_REMINDER_OFFSET),
      }));
    } catch {
      customReminders = [];
    }
  }

  const migrated = normalizeAppSettings({
    ...DEFAULT_APP_SETTINGS,
    city: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    notificationsEnabled: notifications === null ? true : notifications === 'true',
    havdalahMethod: havdalah === 'rabbeinu_tam' ? 'rabbeinu_tam' : 'regular',
    customReminders,
  });

  await saveAppSettings(migrated);
  return migrated;
}

function syncReminderEngineFromAppSettings(settings: AppSettings): void {
  currentReminderSettings = {
    ...currentReminderSettings,
    havdalahMethod: settings.havdalahMethod,
  };
}

async function syncEngineCategoriesFromNotificationPreferences(
  preferences: NotificationCategoryPreferences,
): Promise<void> {
  const enabledEngineCategories = new Set<string>();

  for (const definition of NOTIFICATION_CATEGORY_DEFINITIONS) {
    const pref = preferences[definition.id];
    if (!pref?.enabled || definition.knowledgeOnly) {
      continue;
    }

    for (const engineCategory of definition.engineCategories) {
      enabledEngineCategories.add(engineCategory);
    }
  }

  for (const definition of NOTIFICATION_CATEGORY_DEFINITIONS) {
    for (const engineCategory of definition.engineCategories) {
      const shouldEnable = enabledEngineCategories.has(engineCategory);
      const currentlyEnabled = currentReminderSettings.enabledReminderCategories.includes(engineCategory);
      if (shouldEnable !== currentlyEnabled) {
        await setReminderCategoryEnabled(engineCategory, shouldEnable);
      }
    }
  }
}

async function persistReminderEngineSettings(
  settings: ReminderEngineSettings,
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem('@luach/minhag', settings.minhag),
    AsyncStorage.setItem(
      '@luach/enabled-categories',
      JSON.stringify(settings.enabledReminderCategories),
    ),
    AsyncStorage.setItem(
      '@luach/disabled-rules',
      JSON.stringify(settings.disabledBuiltInReminderIds),
    ),
  ]);
}

export async function loadReminderEngineSettings(): Promise<ReminderEngineSettings> {
  const [minhag, enabledReminderCategories, disabledBuiltInReminderIds] = await Promise.all([
    getLegacyMinhag(),
    getLegacyEnabledCategories(),
    getLegacyDisabledRuleIds(),
  ]);

  currentReminderSettings = {
    minhag,
    enabledReminderCategories,
    disabledBuiltInReminderIds,
    havdalahMethod: currentAppSettings.havdalahMethod,
    israel: true,
  };

  await persistReminderEngineSettings(currentReminderSettings);

  return currentReminderSettings;
}

async function getLegacyMinhag(): Promise<SettingsMinhag> {
  const value = await AsyncStorage.getItem('@luach/minhag');
  if (value === 'ashkenazi' || value === 'sephardi' || value === 'custom') {
    return value;
  }
  return 'ashkenazi';
}

async function getLegacyEnabledCategories(): Promise<ReminderCategory[]> {
  const value = await AsyncStorage.getItem('@luach/enabled-categories');
  if (!value) {
    return DEFAULT_ENABLED_CATEGORIES;
  }
  try {
    return JSON.parse(value) as ReminderCategory[];
  } catch {
    return DEFAULT_ENABLED_CATEGORIES;
  }
}

async function getLegacyDisabledRuleIds(): Promise<string[]> {
  const value = await AsyncStorage.getItem('@luach/disabled-rules');
  if (!value) {
    return DEFAULT_DISABLED_RULE_IDS;
  }
  try {
    return JSON.parse(value) as string[];
  } catch {
    return DEFAULT_DISABLED_RULE_IDS;
  }
}

export async function loadAppSettings(): Promise<AppSettings> {
  const settings = await getAppSettings();
  setCurrentAppSettings(settings);
  await loadReminderEngineSettings();
  return settings;
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const settings = await getAppSettings();
  return settings.notificationsEnabled;
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await updateAppSettings({ notificationsEnabled: enabled });
}

export async function setSelectedCity(cityName: string): Promise<void> {
  const city = getCityByName(cityName);
  await updateAppSettings({
    city: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  });
}

export async function setCandleLightingOffsetMinutes(minutes: number): Promise<void> {
  await updateAppSettings({ candleLightingOffsetMinutes: minutes });
}

export async function setHavdalahMethod(method: 'regular' | 'rabbeinu_tam'): Promise<void> {
  await updateAppSettings({ havdalahMethod: method });
}

export async function setDefaultReminderOffsetMinutes(minutes: number): Promise<void> {
  await updateAppSettings({ defaultReminderOffsetMinutes: minutes });
}

export async function saveCustomReminders(reminders: CustomReminder[]): Promise<void> {
  await updateAppSettings({ customReminders: reminders });
}

export async function isFirstLaunch(): Promise<boolean> {
  const done = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
  return done !== 'true';
}

export async function markFirstLaunchDone(): Promise<void> {
  await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
}

export function isBuiltInReminderGroupEnabled(
  groupId: BuiltInReminderToggleGroupId,
  settings: ReminderEngineSettings = currentReminderSettings,
): boolean {
  const group = BUILT_IN_REMINDER_TOGGLE_GROUPS.find((item) => item.id === groupId);
  if (!group) {
    return false;
  }

  return group.ruleIds.every((ruleId) => !settings.disabledBuiltInReminderIds.includes(ruleId));
}

export async function setBuiltInReminderGroupEnabled(
  groupId: BuiltInReminderToggleGroupId,
  enabled: boolean,
): Promise<ReminderEngineSettings> {
  const group = BUILT_IN_REMINDER_TOGGLE_GROUPS.find((item) => item.id === groupId);
  if (!group) {
    throw new Error(`Unknown reminder group: ${groupId}`);
  }

  const disabled = new Set(currentReminderSettings.disabledBuiltInReminderIds);

  for (const ruleId of group.ruleIds) {
    if (enabled) {
      disabled.delete(ruleId);
    } else {
      disabled.add(ruleId);
    }
  }

  currentReminderSettings = {
    ...currentReminderSettings,
    disabledBuiltInReminderIds: [...disabled],
  };

  await persistReminderEngineSettings(currentReminderSettings);
  return currentReminderSettings;
}

export function isReminderCategoryEnabled(
  category: ReminderCategory,
  settings: ReminderEngineSettings = currentReminderSettings,
): boolean {
  return settings.enabledReminderCategories.includes(category);
}

export async function setReminderCategoryEnabled(
  category: ReminderCategory,
  enabled: boolean,
): Promise<ReminderEngineSettings> {
  const categories = new Set(currentReminderSettings.enabledReminderCategories);

  if (enabled) {
    categories.add(category);
  } else {
    categories.delete(category);
  }

  currentReminderSettings = {
    ...currentReminderSettings,
    enabledReminderCategories: [...categories],
  };

  await persistReminderEngineSettings(currentReminderSettings);
  return currentReminderSettings;
}

export function createCustomReminderId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
