import { currentAppSettings } from '@/lib/appState';
import { getNotificationTriggerDate } from '@/lib/reminderTiming';
import type { UpcomingReminder } from '@/src/engine/types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDaysUntil(reminder: UpcomingReminder, now: Date = new Date()): number {
  const reminderDay = startOfDay(reminder.dateObj);
  const today = startOfDay(now);
  return Math.round((reminderDay.getTime() - today.getTime()) / DAY_MS);
}

function msUntilTrigger(
  reminder: UpcomingReminder,
  now: Date = new Date(),
): number | null {
  const triggerDate = getNotificationTriggerDate(reminder, currentAppSettings);
  if (!triggerDate) {
    return null;
  }

  return triggerDate.getTime() - now.getTime();
}

export function formatReminderAppearanceDay(reminder: UpcomingReminder): string {
  return `${reminder.dayOfWeek}`;
}

export function formatHomeReminderCountdown(
  reminder: UpcomingReminder,
  now: Date = new Date(),
): string {
  const diffDays = calendarDaysUntil(reminder, now);
  const untilTrigger = msUntilTrigger(reminder, now);

  if (untilTrigger !== null && untilTrigger > 0 && untilTrigger < HOUR_MS) {
    return 'עוד פחות משעה';
  }

  if (diffDays === 0) {
    return 'היום';
  }

  if (diffDays === 1) {
    return 'מחר';
  }

  const totalMs = untilTrigger ?? diffDays * DAY_MS;
  if (totalMs <= 0) {
    return 'היום';
  }

  const days = Math.floor(totalMs / DAY_MS);
  const hours = Math.floor((totalMs % DAY_MS) / HOUR_MS);

  if (hours === 0) {
    return days === 1 ? 'עוד יום אחד' : `עוד ${days} ימים`;
  }

  const daysLabel = days === 1 ? 'יום' : `${days} ימים`;
  const hoursLabel = hours === 1 ? 'שעה' : `${hours} שעות`;
  return `עוד ${daysLabel} ו־${hoursLabel}`;
}

export function formatRelativeReminderLabel(
  reminder: UpcomingReminder,
  now: Date = new Date(),
): string {
  const triggerDate = getNotificationTriggerDate(reminder, currentAppSettings);
  const diffDays = calendarDaysUntil(reminder, now);

  if (diffDays === 0) {
    if (triggerDate && triggerDate.getTime() > now.getTime()) {
      const hoursUntil = (triggerDate.getTime() - now.getTime()) / HOUR_MS;
      if (hoursUntil >= 1) {
        const hours = Math.ceil(hoursUntil);
        return hours === 1 ? 'בעוד שעה' : `בעוד ${hours} שעות`;
      }
    }
    return 'היום';
  }

  if (diffDays === 1) {
    return 'מחר';
  }

  return `בעוד ${diffDays} ימים`;
}
