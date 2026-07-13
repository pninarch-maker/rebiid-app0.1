import {
  BUILT_IN_REMINDER_RULES as catalogRules,
  DEFAULT_DISABLED_RULE_IDS as catalogDisabledRuleIds,
  getBuiltInReminderRules,
  validateReminderCatalog,
} from './reminders/index';

export const BUILT_IN_REMINDER_RULES = catalogRules ?? [];
export const DEFAULT_DISABLED_RULE_IDS = catalogDisabledRuleIds ?? [];

export { getBuiltInReminderRules, validateReminderCatalog };
