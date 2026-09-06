/**
 * Deterministic Hebrew ↔ Gregorian calendar helpers for personal reminders.
 * Pure domain — no React, no notifications, no AI.
 */
import { gematriya, HDate, Locale, months } from '@hebcal/core';

import { toStoredHebrewMonthName } from '@/lib/hebrewMonths';
import type {
  GregorianDateAnchor,
  HebrewDateAnchor,
  HebrewMonthIdentifier,
  PersonalReminderValidationError,
} from '@/lib/personalReminderTypes';

const HEBREW_LOCALE = 'he-x-NoNikud';

const GREGORIAN_MONTHS_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
] as const;

const WEEKDAYS_HE = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת',
] as const;

const MONTH_TO_HEBCAL: Record<HebrewMonthIdentifier, number> = {
  Nisan: months.NISAN,
  Iyyar: months.IYYAR,
  Sivan: months.SIVAN,
  Tammuz: months.TAMUZ,
  Av: months.AV,
  Elul: months.ELUL,
  Tishrei: months.TISHREI,
  Cheshvan: months.CHESHVAN,
  Kislev: months.KISLEV,
  Tevet: months.TEVET,
  Shvat: months.SHVAT,
  Adar: months.ADAR_I,
  'Adar I': months.ADAR_I,
  'Adar II': months.ADAR_II,
};

const HEBCAL_MONTH_TO_STORED: Record<string, HebrewMonthIdentifier> = {
  Nisan: 'Nisan',
  Iyyar: 'Iyyar',
  Sivan: 'Sivan',
  Tamuz: 'Tammuz',
  Tammuz: 'Tammuz',
  Av: 'Av',
  Elul: 'Elul',
  Tishrei: 'Tishrei',
  Cheshvan: 'Cheshvan',
  Kislev: 'Kislev',
  Tevet: 'Tevet',
  Shvat: 'Shvat',
  Shevat: 'Shvat',
  Adar: 'Adar',
  'Adar I': 'Adar I',
  'Adar II': 'Adar II',
};

export function isHebrewMonthIdentifier(value: string): value is HebrewMonthIdentifier {
  return Object.prototype.hasOwnProperty.call(MONTH_TO_HEBCAL, value);
}

export function parseIsoCalendarDate(isoDate: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** Local calendar date → YYYY-MM-DD (no UTC shift). */
export function toIsoCalendarDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isoToLocalDate(isoDate: string): Date | null {
  const parts = parseIsoCalendarDate(isoDate);
  if (!parts) {
    return null;
  }
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function hdateToHebrewAnchor(hdate: HDate): HebrewDateAnchor {
  const rawName = String(hdate.getMonthName());
  const stored = toStoredHebrewMonthName(rawName);
  const month = (HEBCAL_MONTH_TO_STORED[stored] ??
    HEBCAL_MONTH_TO_STORED[rawName]) as HebrewMonthIdentifier | undefined;
  if (!month) {
    throw new Error(`Unsupported Hebrew month from HDate: ${rawName}`);
  }
  return {
    day: hdate.getDate(),
    month,
    year: hdate.getFullYear(),
  };
}

export function hebrewAnchorToHDate(anchor: HebrewDateAnchor): HDate {
  const monthNum = MONTH_TO_HEBCAL[anchor.month];
  return new HDate(anchor.day, monthNum, anchor.year);
}

export function gregorianIsoToHebrewAnchor(isoDate: string): {
  ok: true;
  anchor: HebrewDateAnchor;
} | {
  ok: false;
  error: PersonalReminderValidationError;
} {
  const local = isoToLocalDate(isoDate);
  if (!local) {
    return {
      ok: false,
      error: {
        code: 'invalid_gregorian_date',
        messageHe: 'התאריך הלועזי אינו תקין. יש להזין יום, חודש ושנה מלאים.',
        field: 'originalGregorianDate',
      },
    };
  }
  return { ok: true, anchor: hdateToHebrewAnchor(new HDate(local)) };
}

export function validateHebrewAnchor(
  anchor: Pick<HebrewDateAnchor, 'day' | 'month' | 'year'>,
): PersonalReminderValidationError | null {
  if (!isHebrewMonthIdentifier(anchor.month)) {
    return {
      code: 'unsupported_month',
      messageHe: 'חודש עברי לא נתמך.',
      field: 'hebrewMonth',
    };
  }
  if (!Number.isInteger(anchor.year) || anchor.year < 1) {
    return {
      code: 'invalid_hebrew_date',
      messageHe: 'שנה עברית אינה תקינה.',
      field: 'hebrewYear',
    };
  }
  if (!Number.isInteger(anchor.day) || anchor.day < 1 || anchor.day > 30) {
    return {
      code: 'invalid_hebrew_date',
      messageHe: 'יום עברי אינו תקין.',
      field: 'hebrewDay',
    };
  }

  const monthNum = MONTH_TO_HEBCAL[anchor.month];
  const daysInMonth = HDate.daysInMonth(monthNum, anchor.year);

  // Adar II only exists in leap years.
  if (anchor.month === 'Adar II' && !HDate.isLeapYear(anchor.year)) {
    return {
      code: 'invalid_hebrew_date',
      messageHe: 'אדר ב׳ קיים רק בשנה מעוברת.',
      field: 'hebrewMonth',
    };
  }

  if (anchor.day > daysInMonth) {
    return {
      code: 'invalid_hebrew_date',
      messageHe: `ביום ${anchor.day} אין קיום בחודש זה בשנה שנבחרה.`,
      field: 'hebrewDay',
    };
  }

  return null;
}

export function hebrewAnchorToGregorianIso(anchor: HebrewDateAnchor): {
  ok: true;
  isoDate: string;
} | {
  ok: false;
  error: PersonalReminderValidationError;
} {
  const invalid = validateHebrewAnchor(anchor);
  if (invalid) {
    return { ok: false, error: invalid };
  }
  const greg = hebrewAnchorToHDate(anchor).greg();
  return { ok: true, isoDate: toIsoCalendarDate(greg) };
}

/** Advance exactly one Hebrew day (after-sunset correction). */
export function advanceHebrewAnchorOneDay(anchor: HebrewDateAnchor): HebrewDateAnchor {
  const next = hebrewAnchorToHDate(anchor).next();
  return hdateToHebrewAnchor(next);
}

export function applyAfterSunsetIfNeeded(
  anchor: HebrewDateAnchor,
  occurredAfterSunset: boolean,
): HebrewDateAnchor {
  return occurredAfterSunset ? advanceHebrewAnchorOneDay(anchor) : anchor;
}

export function formatHebrewAnchorHe(anchor: HebrewDateAnchor): string {
  const day = gematriya(anchor.day);
  const month = Locale.gettext(
    anchor.month === 'Adar I'
      ? 'Adar I'
      : anchor.month === 'Adar II'
        ? 'Adar II'
        : anchor.month === 'Tammuz'
          ? 'Tamuz'
          : anchor.month === 'Shvat'
            ? 'Shvat'
            : anchor.month,
    HEBREW_LOCALE,
  );
  const year = gematriya(anchor.year);
  return `${day} ב${month} ${year}`;
}

export function formatHebrewMonthDayHe(day: number, month: HebrewMonthIdentifier): string {
  const dayLabel = gematriya(day);
  const monthLabel = Locale.gettext(
    month === 'Tammuz' ? 'Tamuz' : month === 'Shvat' ? 'Shvat' : month,
    HEBREW_LOCALE,
  );
  return `${dayLabel} ב${monthLabel}`;
}

export function formatGregorianIsoHe(isoDate: string): string {
  const parts = parseIsoCalendarDate(isoDate);
  if (!parts) {
    return isoDate;
  }
  return `${parts.day} ב${GREGORIAN_MONTHS_HE[parts.month - 1]} ${parts.year}`;
}

export function formatWeekdayHeFromIso(isoDate: string): string {
  const local = isoToLocalDate(isoDate);
  if (!local) {
    return '';
  }
  return WEEKDAYS_HE[local.getDay()];
}

export function daysInHebrewMonth(month: HebrewMonthIdentifier, year: number): number {
  return HDate.daysInMonth(MONTH_TO_HEBCAL[month], year);
}

export function isHebrewLeapYear(year: number): boolean {
  return HDate.isLeapYear(year);
}

export function hebcalMonthNumber(month: HebrewMonthIdentifier): number {
  return MONTH_TO_HEBCAL[month];
}

export function resolveStoredMonthFromHDate(hdate: HDate): HebrewMonthIdentifier {
  return hdateToHebrewAnchor(hdate).month;
}

export function buildGregorianAnchor(isoDate: string): GregorianDateAnchor {
  return { isoDate };
}

export function validateReminderTimeLocal(time: string): PersonalReminderValidationError | null {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return {
      code: 'invalid_time',
      messageHe: 'שעת התזכורת חייבת להיות בפורמט HH:MM.',
      field: 'time',
    };
  }
  const [hh, mm] = time.split(':').map(Number);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return {
      code: 'invalid_time',
      messageHe: 'שעת התזכורת אינה תקינה.',
      field: 'time',
    };
  }
  return null;
}
