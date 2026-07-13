export type {
  AppReminder as Reminder,
  ReminderCategory,
  ReminderSeverity,
} from '../reminders/types';

export interface ReminderDayContext {
  date: Date;
  israel: boolean;
}
