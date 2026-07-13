import type { Reminder } from './Reminder';

export interface HebrewMonthDay {
  date: Date | null;
  hebrewDayNumber: number | null;
  gregorianDayNumber: number | null;
  isToday: boolean;
  isShabbat: boolean;
  isCurrentMonth: boolean;
  holidays: string[];
  reminders: Reminder[];
}

export interface HebrewMonthWeek {
  days: HebrewMonthDay[];
}

export interface HebrewMonth {
  monthTitleHebrew: string;
  gregorianRangeText: string;
  weeks: HebrewMonthWeek[];
}
