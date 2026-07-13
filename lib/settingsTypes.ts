import type { ZmanimCalculationProfile } from '@/src/engine/zmanim/types';

import type {
  AdvanceReminderMinutes,
  NotificationCategoryId,
  NotificationCategoryPreference,
  NotificationDeliveryMode,
} from './notificationCategories';
import { createDefaultNotificationCategoryPreferences } from './notificationCategoryPrefs';

export type { AdvanceReminderMinutes, NotificationCategoryId, NotificationCategoryPreference, NotificationDeliveryMode };
export type { ZmanimCalculationProfile };

export type HavdalahMethod = 'regular' | 'rabbeinu_tam';

export type NotificationSound = 'default' | 'gentle' | 'classic' | 'silent';

export type AddressGender = 'male' | 'female' | 'unspecified';

export type AppearancePreference = import('./appearancePreference').AppearancePreference;

/** Use defaultReminderOffsetMinutes from app settings. */
export const USE_DEFAULT_REMINDER_OFFSET = -1;

export type CustomReminderCategory = 'personal' | 'minhag_segulah';

export interface CustomReminder {
  id: string;
  title: string;
  message: string;
  hebrewMonth: string;
  hebrewDay: number;
  time: string;
  enabled: boolean;
  reminderOffsetMinutes: number;
  /** Defaults to personal. Minhag/segulah reminders require the category toggle in settings. */
  category?: CustomReminderCategory;
}

export type NotificationCategoryPreferences = Record<
  NotificationCategoryId,
  NotificationCategoryPreference
>;

export interface AppSettings {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  candleLightingOffsetMinutes: number;
  havdalahMethod: HavdalahMethod;
  notificationsEnabled: boolean;
  defaultReminderOffsetMinutes: number;
  customReminders: CustomReminder[];
  notificationSoundEnabled: boolean;
  notificationVibrationEnabled: boolean;
  notificationSound: NotificationSound;
  notificationCategoryPreferences: NotificationCategoryPreferences;
  zmanimProfile: ZmanimCalculationProfile;
  addressGender: AddressGender;
  appearancePreference: AppearancePreference;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  city: 'ירושלים',
  latitude: 31.7683,
  longitude: 35.2137,
  timezone: 'Asia/Jerusalem',
  candleLightingOffsetMinutes: 40,
  havdalahMethod: 'regular',
  notificationsEnabled: true,
  defaultReminderOffsetMinutes: 60,
  customReminders: [],
  notificationSoundEnabled: true,
  notificationVibrationEnabled: true,
  notificationSound: 'default',
  notificationCategoryPreferences: createDefaultNotificationCategoryPreferences({
    notificationSound: 'default',
    notificationVibrationEnabled: true,
    defaultReminderOffsetMinutes: 60,
  }),
  zmanimProfile: 'gra',
  addressGender: 'male',
  appearancePreference: 'system',
};

export const ADDRESS_GENDER_OPTIONS: { key: AddressGender; label: string }[] = [
  { key: 'male', label: 'גבר' },
  { key: 'female', label: 'אשה' },
  { key: 'unspecified', label: 'לא מוגדר' },
];

export const CANDLE_LIGHTING_PRESETS = [18, 20, 30, 40] as const;

export const REMINDER_OFFSET_PRESETS = [
  { label: 'בזמן האירוע', minutes: 0 },
  { label: '10 דקות לפני', minutes: 10 },
  { label: '30 דקות לפני', minutes: 30 },
  { label: 'שעה לפני', minutes: 60 },
  { label: 'יום לפני', minutes: 1440 },
] as const;

export const HEBREW_MONTHS = [
  'Nisan',
  'Iyyar',
  'Sivan',
  'Tammuz',
  'Av',
  'Elul',
  'Tishrei',
  'Cheshvan',
  'Kislev',
  'Tevet',
  'Shvat',
  'Adar',
  'Adar II',
] as const;
