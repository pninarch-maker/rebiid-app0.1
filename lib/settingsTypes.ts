import type { ZmanimCalculationProfile } from '@/src/engine/zmanim/types';

import type {
  AdvanceReminderMinutes,
  NotificationCategoryId,
  NotificationCategoryPreference,
  NotificationDeliveryMode,
} from './notificationCategories';
import { createDefaultNotificationCategoryPreferences } from './notificationCategoryPrefs';
import type { NotificationMode } from './notificationMode';
import type {
  GregorianDateAnchor,
  HebrewDateAnchor,
  PersonalReminderKind,
  PersonalReminderOccurrence,
  ReminderInputCalendar,
  ReminderRecurrence,
  YahrzeitObservancePolicy,
} from './personalReminderTypes';

export type { AdvanceReminderMinutes, NotificationCategoryId, NotificationCategoryPreference, NotificationDeliveryMode, NotificationMode };
export type { ZmanimCalculationProfile };
export type {
  GregorianDateAnchor,
  HebrewDateAnchor,
  PersonalReminderKind,
  PersonalReminderOccurrence,
  ReminderInputCalendar,
  ReminderRecurrence,
  YahrzeitObservancePolicy,
};

export type HavdalahMethod = 'regular' | 'rabbeinu_tam';

export type NotificationSound = 'default' | 'gentle' | 'classic' | 'silent';

export type AddressGender = 'male' | 'female' | 'unspecified';

export type AppearancePreference = import('./appearancePreference').AppearancePreference;

/** Use defaultReminderOffsetMinutes from app settings. */
export const USE_DEFAULT_REMINDER_OFFSET = -1;

export type CustomReminderCategory = 'personal' | 'minhag_segulah';

/**
 * User-defined reminder. Legacy records only set the classic fields.
 * Personal Hebrew-date reminders (schemaVersion >= 1) also carry anchors and policies.
 */
export interface CustomReminder {
  id: string;
  title: string;
  message: string;
  /** Denormalized from effectiveHebrewAnchor for legacy matching / display. */
  hebrewMonth: string;
  hebrewDay: number;
  time: string;
  enabled: boolean;
  reminderOffsetMinutes: number;
  /** Defaults to personal. Minhag/segulah reminders require the category toggle in settings. */
  category?: CustomReminderCategory;

  /** Personal-reminder schema (optional for backward compatibility). */
  schemaVersion?: number;
  kind?: PersonalReminderKind;
  inputCalendar?: ReminderInputCalendar;
  originalGregorianDate?: GregorianDateAnchor;
  originalHebrewDate?: HebrewDateAnchor;
  occurredAfterSunset?: boolean;
  effectiveHebrewAnchor?: HebrewDateAnchor;
  recurrence?: ReminderRecurrence;
  reminderTimeLocal?: string;
  yahrzeitPolicy?: YahrzeitObservancePolicy;
  calendarRuleVersion?: string;
  scheduledOccurrences?: PersonalReminderOccurrence[];
  createdAt?: string;
  updatedAt?: string;
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
  notificationMode: NotificationMode;
  /** @deprecated Synced from notificationMode for backward compatibility. */
  notificationSoundEnabled: boolean;
  /** @deprecated Synced from notificationMode for backward compatibility. */
  notificationVibrationEnabled: boolean;
  /** @deprecated Synced from notificationMode for backward compatibility. */
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
  notificationMode: 'device_sound',
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
