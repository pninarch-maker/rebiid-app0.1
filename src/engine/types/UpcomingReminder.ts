import type { AppReminder } from '../reminders/types';

export interface UpcomingReminder extends AppReminder {
  dateObj: Date;
}

export interface UpcomingReminderDayGroup {
  dateKey: string;
  date: Date;
  hebrewDate: string;
  gregorianDate: string;
  dayOfWeek: string;
  reminders: UpcomingReminder[];
}
