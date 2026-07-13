export type ReminderCategory =
  | 'shabbat'
  | 'rosh_chodesh'
  | 'prayer'
  | 'fast'
  | 'rosh_hashanah'
  | 'yom_kippur'
  | 'sukkot'
  | 'chanukah'
  | 'purim'
  | 'pesach'
  | 'omer'
  | 'shavuot'
  | 'three_weeks'
  | 'elul'
  | 'special_events'
  | 'minhag_segulah'
  | 'personal';

export type BuiltInReminderToggleGroupId =
  | 'birkat_hachama'
  | 'taanit_bechorot'
  | 'erev_rosh_hashanah_fast';

export type Minhag = 'all' | 'ashkenazi' | 'sephardi' | 'custom';

export type ReminderTriggerType =
  | 'hebrew_date'
  | 'holiday'
  | 'weekday'
  | 'relative_to_holiday'
  | 'relative_to_zman'
  | 'special_calendar_pattern';

export type ReminderSeverity = 'info' | 'important';

export type HavdalahMethod = 'regular' | 'rabbeinu_tam';

export type SettingsMinhag = 'ashkenazi' | 'sephardi' | 'custom';

export interface BuiltInReminderRule {
  id: string;
  category: ReminderCategory;
  title: string;
  message: string;
  triggerType: ReminderTriggerType;
  hebrewMonth?: string;
  hebrewDay?: number;
  holidayKeywords?: string[];
  weekday?: number;
  weekdayHour?: number;
  offsetDays?: number;
  offsetMinutes?: number;
  minhag: Minhag;
  israelOnly?: boolean;
  enabledByDefault: boolean;
  severity?: ReminderSeverity;
  requiresCandleLighting?: boolean;
  requiresHavdalah?: boolean;
  requiresEruvTavshilin?: boolean;
  requiresHavdalahMethod?: HavdalahMethod;
  informationalOnly?: boolean;
  patternId?: string;
  /** Zman used for relative_to_zman triggers and notification scheduling. */
  zmanAnchor?: 'candleLighting' | 'sunset' | 'nightfall';
  /** Local notification hour (0–23) when not scheduled by zman. Defaults to 9. */
  defaultNotificationHour?: number;
  /** Local notification time (HH:MM). Takes precedence over defaultNotificationHour. */
  defaultNotificationTime?: string;
}

export interface AppReminder {
  id: string;
  date: string;
  hebrewDate: string;
  gregorianDate: string;
  dayOfWeek: string;
  title: string;
  message: string;
  category: ReminderCategory;
  severity: ReminderSeverity;
  source: 'built_in' | 'personal';
  ruleId?: string;
}

export interface CustomReminder {
  id: string;
  title: string;
  message: string;
  hebrewMonth: string;
  hebrewDay: number;
  time: string;
  enabled: boolean;
  reminderOffsetMinutes: number;
  category?: 'personal' | 'minhag_segulah';
}

/** @deprecated Use CustomReminder */
export type PersonalReminder = CustomReminder;

export interface ReminderEngineSettings {
  minhag: SettingsMinhag;
  enabledReminderCategories: ReminderCategory[];
  disabledBuiltInReminderIds: string[];
  havdalahMethod: HavdalahMethod;
  israel: boolean;
}

export const DEFAULT_ENABLED_CATEGORIES: ReminderCategory[] = [
  'shabbat',
  'rosh_chodesh',
  'prayer',
  'fast',
  'rosh_hashanah',
  'yom_kippur',
  'sukkot',
  'chanukah',
  'purim',
  'pesach',
  'omer',
  'shavuot',
  'three_weeks',
  'elul',
  'special_events',
  'personal',
];

export const CATEGORY_LABELS: Record<ReminderCategory, string> = {
  shabbat: 'שבת',
  rosh_chodesh: 'ראש חודש',
  prayer: 'תפילה',
  fast: 'צומות',
  rosh_hashanah: 'ראש השנה',
  yom_kippur: 'יום כיפור',
  sukkot: 'סוכות',
  chanukah: 'חנוכה',
  purim: 'פורים',
  pesach: 'פסח',
  omer: 'ספירת העומר',
  shavuot: 'שבועות',
  three_weeks: 'שלושת השבועות',
  elul: 'אלול',
  special_events: 'מנהגים ואירועים מיוחדים',
  minhag_segulah: 'תזכורות מנהג וסגולה',
  personal: 'אישי',
};

export const BUILT_IN_REMINDER_TOGGLE_GROUPS: {
  id: BuiltInReminderToggleGroupId;
  label: string;
  ruleIds: string[];
}[] = [
  {
    id: 'birkat_hachama',
    label: 'ברכת החמה',
    ruleIds: ['birkat_hachama_eve', 'birkat_hachama_day'],
  },
  {
    id: 'taanit_bechorot',
    label: 'תענית בכורות',
    ruleIds: ['taanit_bechorot', 'taanit_bechorot_eve'],
  },
  {
    id: 'erev_rosh_hashanah_fast',
    label: 'תענית ערב ראש השנה',
    ruleIds: ['erev_rosh_hashanah_fast', 'erev_rosh_hashanah_fast_eve'],
  },
];

export const TOGGLE_CATEGORIES: { key: ReminderCategory[]; label: string }[] = [
  { key: ['shabbat'], label: 'שבת' },
  { key: ['rosh_chodesh'], label: 'ראש חודש' },
  { key: ['prayer'], label: 'תפילה' },
  { key: ['fast'], label: 'צומות' },
  { key: ['rosh_hashanah', 'yom_kippur', 'sukkot', 'chanukah', 'purim', 'shavuot', 'elul'], label: 'חגים' },
  { key: ['pesach'], label: 'פסח' },
  { key: ['omer'], label: 'ספירת העומר' },
  { key: ['three_weeks'], label: 'שלושת השבועות' },
  { key: ['special_events'], label: 'מנהגים ואירועים מיוחדים' },
];
