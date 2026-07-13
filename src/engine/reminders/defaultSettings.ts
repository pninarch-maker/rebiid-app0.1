import { DEFAULT_DISABLED_RULE_IDS } from '@/src/data/reminders';

import {
  DEFAULT_ENABLED_CATEGORIES,
  type ReminderEngineSettings,
} from './types';

export function getDefaultReminderEngineSettings(israel = true): ReminderEngineSettings {
  return {
    minhag: 'ashkenazi',
    enabledReminderCategories: DEFAULT_ENABLED_CATEGORIES,
    disabledBuiltInReminderIds: DEFAULT_DISABLED_RULE_IDS ?? [],
    havdalahMethod: 'regular',
    israel,
  };
}
