import { getCalendarDay, getHebrewMonth } from './calendar';
import {
  getUpcomingRemindersSync,
  type UpcomingReminder,
} from './reminders/getUpcomingReminders';
import { getRemindersForDay } from './reminders/getRemindersForDay';
import {
  DEFAULT_ENGINE_CONFIG,
  type EngineConfig,
  type HebrewMonth,
  type JewishDay,
} from './types';
import { getZmanim } from './zmanim';

function buildJewishDay(config: EngineConfig, date: Date): JewishDay {
  const calendar = getCalendarDay(config, date);
  const zmanim = getZmanim(date);
  const reminders = getRemindersForDay(date);

  return {
    hebrewDate: calendar.hebrewDate,
    gregorianDate: calendar.gregorianDate,
    dayOfWeek: calendar.dayOfWeek,
    parasha: calendar.parasha,
    holidays: calendar.holidays,
    zmanim,
    reminders,
  };
}

export const JewishEngine = {
  getToday(date: Date = new Date()): JewishDay {
    return buildJewishDay(DEFAULT_ENGINE_CONFIG, date);
  },

  getUpcomingReminders(
    daysAhead: number = 30,
    startDate: Date = new Date(),
  ): UpcomingReminder[] {
    return getUpcomingRemindersSync(daysAhead, startDate);
  },

  getFirstUpcomingReminder(
    daysAhead: number = 30,
    startDate: Date = new Date(),
  ): UpcomingReminder | undefined {
    return getUpcomingRemindersSync(daysAhead, startDate)[0];
  },

  getHebrewMonth(date: Date = new Date()): HebrewMonth {
    return getHebrewMonth(date, DEFAULT_ENGINE_CONFIG);
  },
};

export type {
  EngineConfig,
  HebrewMonth,
  HebrewMonthDay,
  HebrewMonthWeek,
  JewishDay,
  JewishDayZmanim,
  Reminder,
  ReminderCategory,
  ReminderSeverity,
  UpcomingReminder,
} from './types';
