/**
 * Personal Hebrew-date reminder types (schema v1).
 * Extends persisted CustomReminder fields without breaking legacy records.
 */

export const PERSONAL_REMINDER_SCHEMA_VERSION = 1;

/** Rule-engine version stamped on each personal reminder for future migrations. */
export const CALENDAR_RULE_VERSION = 'hebcal-core-6.6-v1';

/** Rolling local-notification horizon used by REBIID (matches getUpcomingReminders). */
export const PERSONAL_REMINDER_SCHEDULE_HORIZON_DAYS = 30;

export type PersonalReminderKind = 'birthday' | 'yahrzeit' | 'other';
export type ReminderInputCalendar = 'hebrew' | 'gregorian';
export type ReminderRecurrence = 'once' | 'annual_hebrew';

/** English storage month identifiers used across REBIID. */
export type HebrewMonthIdentifier =
  | 'Nisan'
  | 'Iyyar'
  | 'Sivan'
  | 'Tammuz'
  | 'Av'
  | 'Elul'
  | 'Tishrei'
  | 'Cheshvan'
  | 'Kislev'
  | 'Tevet'
  | 'Shvat'
  | 'Adar'
  | 'Adar I'
  | 'Adar II';

export type HebrewDateAnchor = {
  day: number;
  month: HebrewMonthIdentifier;
  year: number;
};

/** Calendar date only — never a timezone-shifted timestamp. */
export type GregorianDateAnchor = {
  isoDate: string; // YYYY-MM-DD
};

export type YahrzeitObservancePolicy = {
  adarInLeapYear?: 'adar_i' | 'adar_ii' | 'both';
  missingDayThirty?: 'day_29' | 'first_of_next_month' | 'both';
};

export type PersonalReminderOccurrence = {
  occurrenceId: string;
  gregorianDate: string;
  notificationId: string;
};

export type PersonalReminderFields = {
  schemaVersion: number;
  kind: PersonalReminderKind;
  inputCalendar: ReminderInputCalendar;
  originalGregorianDate?: GregorianDateAnchor;
  originalHebrewDate?: HebrewDateAnchor;
  occurredAfterSunset: boolean;
  effectiveHebrewAnchor: HebrewDateAnchor;
  recurrence: ReminderRecurrence;
  reminderTimeLocal: string;
  yahrzeitPolicy?: YahrzeitObservancePolicy;
  calendarRuleVersion: string;
  scheduledOccurrences: PersonalReminderOccurrence[];
  createdAt: string;
  updatedAt: string;
};

export type PersonalReminderValidationCode =
  | 'missing_title'
  | 'invalid_time'
  | 'invalid_gregorian_date'
  | 'missing_gregorian_year'
  | 'invalid_hebrew_date'
  | 'missing_adar_policy'
  | 'missing_day_thirty_policy'
  | 'unsupported_month';

export type PersonalReminderValidationError = {
  code: PersonalReminderValidationCode;
  messageHe: string;
  field?: string;
};

export const PERSONAL_REMINDER_KIND_OPTIONS: {
  key: PersonalReminderKind;
  label: string;
}[] = [
  { key: 'birthday', label: 'יום הולדת' },
  { key: 'yahrzeit', label: 'יארצייט / יום פטירה' },
  { key: 'other', label: 'אירוע אישי אחר' },
];

export const YAHRZEIT_DISCLAIMER_HE =
  'במקרים של אדר או יום שאינו קיים בכל שנה, קיימים מנהגי משפחה ודעות שונות. בחרו את המנהג המקובל אצלכם או התייעצו עם רב.';
