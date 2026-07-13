import { currentAppSettings, currentReminderSettings } from '@/lib/settings';
import { toGregorianDateOnly } from '@/src/engine/zmanim/formatTime';

import { addDays } from './helpers';
import { getAppRemindersForDay } from './ruleEngine';
import type { AppReminder } from './types';
import type { UpcomingReminder, UpcomingReminderDayGroup } from '../types/UpcomingReminder';

export type { UpcomingReminder, UpcomingReminderDayGroup };

function appReminderToUpcoming(reminder: AppReminder, dateObj: Date): UpcomingReminder {
  return { ...reminder, dateObj };
}

function dedupeReminders(reminders: UpcomingReminder[]): UpcomingReminder[] {
  const seen = new Set<string>();

  return reminders.filter((reminder) => {
    const key = `${reminder.date}-${reminder.ruleId ?? reminder.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeDayGroupReminders(reminders: UpcomingReminder[]): UpcomingReminder[] {
  const seen = new Set<string>();

  return reminders.filter((reminder) => {
    const key = reminder.ruleId ?? reminder.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getUpcomingRemindersSync(
  daysAhead: number = 30,
  startDate: Date = new Date(),
): UpcomingReminder[] {
  const start = toGregorianDateOnly(startDate);
  const upcoming: UpcomingReminder[] = [];

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = addDays(start, offset);
    const reminders = getAppRemindersForDay(
      date,
      currentReminderSettings,
      currentAppSettings.customReminders,
    );

    for (const reminder of reminders) {
      upcoming.push(appReminderToUpcoming(reminder, date));
    }
  }

  return dedupeReminders(upcoming);
}

export function groupUpcomingRemindersByDay(
  reminders: UpcomingReminder[],
): UpcomingReminderDayGroup[] {
  const groups = new Map<string, UpcomingReminderDayGroup>();

  for (const reminder of reminders) {
    const dateKey = reminder.date;
    const existing = groups.get(dateKey);

    if (existing) {
      existing.reminders = dedupeDayGroupReminders([...existing.reminders, reminder]);
      continue;
    }

    groups.set(dateKey, {
      dateKey,
      date: reminder.dateObj,
      hebrewDate: reminder.hebrewDate,
      gregorianDate: reminder.gregorianDate,
      dayOfWeek: reminder.dayOfWeek,
      reminders: [reminder],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    reminders: dedupeDayGroupReminders(group.reminders),
  }));
}
