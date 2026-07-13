import type { BuiltInReminderRule } from '@/src/engine/reminders/types';
import { CATALOG_REMINDER_RULES } from './catalogRulesOnly';
import { applyReminderContent, type ReminderContentDatabase } from './reminderContent';
import reminderContentRaw from './generated/reminderContent.generated.json';

const reminderContent = reminderContentRaw as ReminderContentDatabase;

export const BUILT_IN_REMINDER_RULES: BuiltInReminderRule[] = applyReminderContent(
  CATALOG_REMINDER_RULES,
  reminderContent,
);

export const DEFAULT_DISABLED_RULE_IDS = BUILT_IN_REMINDER_RULES.filter(
  (item) => !item.enabledByDefault,
).map((item) => item.id);

export function getBuiltInReminderRules(): readonly BuiltInReminderRule[] {
  return BUILT_IN_REMINDER_RULES ?? [];
}

export { validateReminderCatalog } from './createRule';
export { CATALOG_REMINDER_RULES } from './catalogRulesOnly';
