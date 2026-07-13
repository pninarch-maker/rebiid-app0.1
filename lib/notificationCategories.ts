import type { BuiltInReminderRule, ReminderCategory } from '@/src/engine/reminders/types';
import type { AppReminder } from '@/src/engine/reminders/types';

export type NotificationCategoryId =
  | 'shabbat'
  | 'holidays'
  | 'fasts'
  | 'zmanim'
  | 'rosh_chodesh'
  | 'omer'
  | 'bein_hametzarim'
  | 'shabbat_holiday_prep'
  | 'minhag_segulah'
  | 'yahrzeits'
  | 'historical_events'
  | 'personal';

export type NotificationDeliveryMode =
  | 'full'
  | 'silent'
  | 'center_only'
  | 'vibration_only'
  | 'sound_only'
  | 'disabled';

export type AdvanceReminderMinutes = 0 | 5 | 15 | 30 | 60 | 1440;

export interface NotificationCategoryPreference {
  enabled: boolean;
  deliveryMode: NotificationDeliveryMode;
  sound: import('./settingsTypes').NotificationSound;
  vibrationEnabled: boolean;
  showOnHome: boolean;
  advanceReminderMinutes: AdvanceReminderMinutes;
}

export interface NotificationCategoryDefinition {
  id: NotificationCategoryId;
  title: string;
  description: string;
  engineCategories: ReminderCategory[];
  matchesRule?: (rule: BuiltInReminderRule) => boolean;
  knowledgeOnly?: boolean;
}

const SHABBAT_PREP_RULE_IDS = new Set([
  'candle_lighting',
  'shabbat_approaching',
  'eruv_tavshilin',
  'prepare_existing_flame',
]);

export const NOTIFICATION_CATEGORY_ORDER: NotificationCategoryId[] = [
  'shabbat',
  'holidays',
  'fasts',
  'zmanim',
  'rosh_chodesh',
  'omer',
  'bein_hametzarim',
  'shabbat_holiday_prep',
  'minhag_segulah',
  'yahrzeits',
  'historical_events',
  'personal',
];

export const NOTIFICATION_CATEGORY_DEFINITIONS: NotificationCategoryDefinition[] = [
  {
    id: 'shabbat_holiday_prep',
    title: 'תזכורות הכנה לשבת וחג',
    description: 'הדלקת נרות, עירוב תבשילין והכנות לפני שבת וחג.',
    engineCategories: ['shabbat'],
    matchesRule: (rule) => SHABBAT_PREP_RULE_IDS.has(rule.id) || Boolean(rule.requiresCandleLighting),
  },
  {
    id: 'zmanim',
    title: 'זמני היום',
    description: 'תזכורות לפי זמני הדלקה, שקיעה וצאת.',
    engineCategories: ['shabbat', 'prayer'],
    matchesRule: (rule) => rule.triggerType === 'relative_to_zman' && !SHABBAT_PREP_RULE_IDS.has(rule.id),
  },
  {
    id: 'shabbat',
    title: 'שבת',
    description: 'תזכורות לשבת, פרשיות מיוחדות ומוצאי שבת.',
    engineCategories: ['shabbat'],
    matchesRule: (rule) =>
      rule.category === 'shabbat' &&
      !SHABBAT_PREP_RULE_IDS.has(rule.id) &&
      rule.triggerType !== 'relative_to_zman',
  },
  {
    id: 'holidays',
    title: 'חגים ומועדים',
    description: 'ראש השנה, חגים, פורים, חנוכה ואירועים מיוחדים.',
    engineCategories: [
      'rosh_hashanah',
      'yom_kippur',
      'sukkot',
      'chanukah',
      'purim',
      'pesach',
      'shavuot',
      'elul',
      'special_events',
    ],
  },
  {
    id: 'fasts',
    title: 'צומות',
    description: 'תזכורות לימי צום ותעניות.',
    engineCategories: ['fast'],
  },
  {
    id: 'rosh_chodesh',
    title: 'ראש חודש',
    description: 'תזכורות לראש חודש וימים סמוכים.',
    engineCategories: ['rosh_chodesh'],
  },
  {
    id: 'omer',
    title: 'ספירת העומר',
    description: 'תזכורות לספירת העומר וימים הקשורים.',
    engineCategories: ['omer'],
  },
  {
    id: 'bein_hametzarim',
    title: 'בין המצרים',
    description: 'תזכורות לשלושת השבועות ותשעה באב.',
    engineCategories: ['three_weeks'],
  },
  {
    id: 'minhag_segulah',
    title: 'מנהגים וסגולות',
    description: 'תזכורות למנהגים, סגולות ותפילות מיוחדות.',
    engineCategories: ['minhag_segulah'],
  },
  {
    id: 'yahrzeits',
    title: 'הילולות ויארצייטים',
    description: 'מידע על הילולאות ויארצייטים — ללא התראות אוטומטיות.',
    engineCategories: [],
    knowledgeOnly: true,
  },
  {
    id: 'historical_events',
    title: 'אירועים היסטוריים',
    description: 'מה קרה היום בהיסטוריה היהודית — לקריאה בלבד.',
    engineCategories: [],
    knowledgeOnly: true,
  },
  {
    id: 'personal',
    title: 'תזכורות אישיות',
    description: 'תזכורות שהוספת בעצמך.',
    engineCategories: ['personal'],
  },
];

export function getNotificationCategoryDefinition(
  id: NotificationCategoryId,
): NotificationCategoryDefinition {
  const definition = NOTIFICATION_CATEGORY_DEFINITIONS.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Unknown notification category: ${id}`);
  }
  return definition;
}

export function resolveNotificationCategoryIdForRule(
  rule: BuiltInReminderRule,
): NotificationCategoryId {
  for (const definition of NOTIFICATION_CATEGORY_DEFINITIONS) {
    if (definition.matchesRule?.(rule)) {
      return definition.id;
    }
  }

  const byEngine = NOTIFICATION_CATEGORY_DEFINITIONS.find((definition) =>
    definition.engineCategories.includes(rule.category),
  );
  return byEngine?.id ?? 'holidays';
}

export function resolveNotificationCategoryIdForReminder(
  reminder: Pick<AppReminder, 'category' | 'ruleId' | 'source'>,
): NotificationCategoryId {
  if (reminder.source === 'personal') {
    return 'personal';
  }

  if (reminder.category === 'minhag_segulah') {
    return 'minhag_segulah';
  }

  if (reminder.ruleId) {
    const { getBuiltInReminderRules } = require('@/src/data/reminders') as typeof import('@/src/data/reminders');
    const rule = getBuiltInReminderRules().find((item) => item.id === reminder.ruleId);
    if (rule) {
      return resolveNotificationCategoryIdForRule(rule);
    }
  }

  const fallback = NOTIFICATION_CATEGORY_DEFINITIONS.find((definition) =>
    definition.engineCategories.includes(reminder.category),
  );
  return fallback?.id ?? 'holidays';
}
