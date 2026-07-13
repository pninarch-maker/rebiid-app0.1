import { getBuiltInReminderRules } from '@/src/data/reminders';
import type { AppReminder, BuiltInReminderRule } from '@/src/engine/reminders/types';
import type { UpcomingReminder } from '@/src/engine/types';

import {
  USE_DEFAULT_REMINDER_OFFSET,
  type AppSettings,
  type CustomReminder,
} from './settingsTypes';
import { getNotificationCategoryPreferenceForReminder } from './notificationCategoryPrefs';

function findBuiltInRule(ruleId?: string): BuiltInReminderRule | undefined {
  if (!ruleId) {
    return undefined;
  }

  return (getBuiltInReminderRules() ?? []).find((item) => item.id === ruleId);
}

function getJewishDay(date: Date) {
  // Lazy import avoids a circular dependency through JewishEngine → settings.
  const { JewishEngine } = require('@/src/engine/JewishEngine') as typeof import('@/src/engine/JewishEngine');
  return JewishEngine.getToday(date);
}

export function resolveReminderOffsetMinutes(
  offsetMinutes: number,
  defaultOffsetMinutes: number,
): number {
  if (offsetMinutes === USE_DEFAULT_REMINDER_OFFSET) {
    return defaultOffsetMinutes;
  }
  return Math.max(0, offsetMinutes);
}

export function getBuiltInRuleOffsetMinutes(ruleId?: string): number | undefined {
  if (!ruleId) {
    return undefined;
  }

  const rule = findBuiltInRule(ruleId);
  if (rule?.offsetMinutes === undefined) {
    return undefined;
  }

  return Math.abs(rule.offsetMinutes);
}

export function getReminderNotificationOffsetMinutes(
  reminder: UpcomingReminder,
  settings: AppSettings,
): number {
  const categoryAdvance = getNotificationCategoryPreferenceForReminder(reminder, settings)
    .advanceReminderMinutes;

  if (reminder.source === 'personal') {
    const custom = settings.customReminders.find((item) => item.id === reminder.ruleId);
    return resolveReminderOffsetMinutes(
      custom?.reminderOffsetMinutes ?? USE_DEFAULT_REMINDER_OFFSET,
      categoryAdvance,
    );
  }

  const ruleOffset = getBuiltInRuleOffsetMinutes(reminder.ruleId);
  if (ruleOffset !== undefined) {
    return ruleOffset;
  }

  return categoryAdvance;
}

export function getCustomReminderById(
  reminders: CustomReminder[],
  id?: string,
): CustomReminder | undefined {
  if (!id) {
    return undefined;
  }

  return reminders.find((reminder) => reminder.id === id);
}

function parseTimeOnDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getBuiltInRule(ruleId?: string): BuiltInReminderRule | undefined {
  return findBuiltInRule(ruleId);
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getEventTimeForReminder(
  reminder: UpcomingReminder,
  settings: AppSettings,
): Date {
  const day = getJewishDay(reminder.dateObj);
  const rule = getBuiltInRule(reminder.ruleId);

  if (rule?.zmanAnchor === 'candleLighting' && day.zmanim.candleLighting) {
    return parseTimeOnDate(reminder.dateObj, day.zmanim.candleLighting);
  }

  if (rule?.zmanAnchor === 'sunset' && day.zmanim.sunset) {
    return parseTimeOnDate(reminder.dateObj, day.zmanim.sunset);
  }

  if (rule?.zmanAnchor === 'nightfall' && day.zmanim.nightfall) {
    return parseTimeOnDate(reminder.dateObj, day.zmanim.nightfall);
  }

  if (rule?.weekdayHour !== undefined) {
    return parseTimeOnDate(reminder.dateObj, formatHour(rule.weekdayHour));
  }

  if (rule?.defaultNotificationTime) {
    return parseTimeOnDate(reminder.dateObj, rule.defaultNotificationTime);
  }

  if (rule?.defaultNotificationHour !== undefined) {
    return parseTimeOnDate(reminder.dateObj, formatHour(rule.defaultNotificationHour));
  }

  if (reminder.source === 'personal') {
    const custom = getCustomReminderById(settings.customReminders, reminder.ruleId);
    return parseTimeOnDate(reminder.dateObj, custom?.time ?? '09:00');
  }

  return parseTimeOnDate(reminder.dateObj, '09:00');
}

export function getNotificationTriggerDate(
  reminder: UpcomingReminder,
  settings: AppSettings,
): Date | null {
  const eventTime = getEventTimeForReminder(reminder, settings);
  const offsetMinutes = getReminderNotificationOffsetMinutes(reminder, settings);
  return new Date(eventTime.getTime() - offsetMinutes * 60 * 1000);
}

export function getRelatedZmanLabel(reminder: UpcomingReminder): string | undefined {
  const day = getJewishDay(reminder.dateObj);
  const { zmanim } = day;
  const rule = getBuiltInRule(reminder.ruleId);

  if (rule?.zmanAnchor === 'candleLighting' && zmanim.candleLighting) {
    return `הדלקת נרות: ${zmanim.candleLighting}`;
  }

  if (rule?.zmanAnchor === 'sunset' && zmanim.sunset) {
    return `שקיעה: ${zmanim.sunset}`;
  }

  if (rule?.zmanAnchor === 'nightfall' && zmanim.nightfall) {
    return `צאת שבת: ${zmanim.nightfall}`;
  }

  if (reminder.source === 'personal' && reminder.ruleId) {
    return undefined;
  }

  return undefined;
}

export function toUpcomingReminder(
  reminder: AppReminder,
  dateObj: Date,
): UpcomingReminder {
  return { ...reminder, dateObj };
}
