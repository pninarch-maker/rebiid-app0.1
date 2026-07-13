import { currentAppSettings, currentReminderSettings } from '@/lib/settings';

import { getAppRemindersForDay } from './ruleEngine';
import type { AppReminder } from './types';

export function getRemindersForDay(date: Date): AppReminder[] {
  return getAppRemindersForDay(date, currentReminderSettings, currentAppSettings.customReminders);
}

export async function getRemindersForDayAsync(date: Date): Promise<AppReminder[]> {
  const { getAppSettings } = await import('@/lib/settings');
  const settings = await getAppSettings();
  return getAppRemindersForDay(date, currentReminderSettings, settings.customReminders);
}
