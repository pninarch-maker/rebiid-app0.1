import type { BuiltInReminderRule } from '@/src/engine/reminders/types';

const DEFAULT_NOTIFICATION_HOUR = 9;

type RuleInput = Partial<BuiltInReminderRule> &
  Pick<BuiltInReminderRule, 'id' | 'category' | 'title' | 'message' | 'triggerType'>;

export function createRule(partial: RuleInput): BuiltInReminderRule {
  return {
    minhag: 'all',
    enabledByDefault: true,
    defaultNotificationHour: DEFAULT_NOTIFICATION_HOUR,
    ...partial,
  };
}

export function validateReminderCatalog(rules: BuiltInReminderRule[]): void {
  const ids = new Set<string>();

  for (const rule of rules) {
    if (!rule.id || !rule.title || !rule.message || !rule.triggerType || !rule.category) {
      throw new Error(`Reminder rule missing required fields: ${rule.id ?? '(no id)'}`);
    }

    if (ids.has(rule.id)) {
      throw new Error(`Duplicate reminder rule id: ${rule.id}`);
    }

    ids.add(rule.id);

    switch (rule.triggerType) {
      case 'hebrew_date':
        if (!rule.hebrewMonth || !rule.hebrewDay) {
          throw new Error(`${rule.id}: hebrew_date requires hebrewMonth and hebrewDay`);
        }
        break;
      case 'holiday':
      case 'relative_to_holiday':
        if (!rule.holidayKeywords?.length) {
          throw new Error(`${rule.id}: holiday trigger requires holidayKeywords`);
        }
        if (rule.triggerType === 'relative_to_holiday' && rule.offsetDays === undefined) {
          throw new Error(`${rule.id}: relative_to_holiday requires offsetDays`);
        }
        break;
      case 'weekday':
        if (rule.weekday === undefined) {
          throw new Error(`${rule.id}: weekday trigger requires weekday`);
        }
        break;
      case 'relative_to_zman':
        if (!rule.zmanAnchor) {
          throw new Error(`${rule.id}: relative_to_zman requires zmanAnchor`);
        }
        break;
      case 'special_calendar_pattern':
        if (!rule.patternId) {
          throw new Error(`${rule.id}: special_calendar_pattern requires patternId`);
        }
        break;
      default:
        break;
    }
  }
}
