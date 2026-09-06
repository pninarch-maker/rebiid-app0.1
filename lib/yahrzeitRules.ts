/**
 * Deterministic yahrzeit / personal-date observance rules.
 * Policies are per-reminder — never a global halachic setting.
 */
import { HDate, months } from '@hebcal/core';

import {
  daysInHebrewMonth,
  hebcalMonthNumber,
  hebrewAnchorToHDate,
  hdateToHebrewAnchor,
  isHebrewLeapYear,
  toIsoCalendarDate,
} from '@/lib/hebrewCalendar';
import type {
  HebrewDateAnchor,
  HebrewMonthIdentifier,
  PersonalReminderKind,
  PersonalReminderValidationError,
  YahrzeitObservancePolicy,
} from '@/lib/personalReminderTypes';

export function isDayThirtyAmbiguousMonth(month: HebrewMonthIdentifier): boolean {
  return month === 'Cheshvan' || month === 'Kislev';
}

export function isRegularAdarAnchor(month: HebrewMonthIdentifier): boolean {
  return month === 'Adar';
}

export function isNamedAdarAnchor(month: HebrewMonthIdentifier): boolean {
  return month === 'Adar I' || month === 'Adar II';
}

export function yahrzeitNeedsAdarPolicy(
  kind: PersonalReminderKind,
  anchor: HebrewDateAnchor,
): boolean {
  return kind === 'yahrzeit' && isRegularAdarAnchor(anchor.month);
}

export function yahrzeitNeedsDayThirtyPolicy(
  kind: PersonalReminderKind,
  anchor: HebrewDateAnchor,
): boolean {
  return kind === 'yahrzeit' && anchor.day === 30 && isDayThirtyAmbiguousMonth(anchor.month);
}

export function validateYahrzeitPoliciesRequired(
  kind: PersonalReminderKind,
  anchor: HebrewDateAnchor,
  policy: YahrzeitObservancePolicy | undefined,
): PersonalReminderValidationError | null {
  if (yahrzeitNeedsAdarPolicy(kind, anchor) && !policy?.adarInLeapYear) {
    return {
      code: 'missing_adar_policy',
      messageHe:
        'ביארצייט באדר רגיל יש לבחור מנהג לשנה מעוברת: אדר א׳, אדר ב׳, או שניהם.',
      field: 'yahrzeitPolicy.adarInLeapYear',
    };
  }
  if (yahrzeitNeedsDayThirtyPolicy(kind, anchor) && !policy?.missingDayThirty) {
    return {
      code: 'missing_day_thirty_policy',
      messageHe:
        'ביארצייט ב־ל׳ בחשוון או בכסלו יש לבחור מנהג כשאין יום ל׳ בשנה: כ״ט בחודש, א׳ בחודש הבא, או שניהם.',
      field: 'yahrzeitPolicy.missingDayThirty',
    };
  }
  return null;
}

/**
 * Resolve Gregorian ISO dates for observing `anchor` inside a specific Hebrew year.
 * May return 0–2 dates depending on policy ("both").
 */
export function resolveObservanceIsoDatesInHebrewYear(
  anchor: HebrewDateAnchor,
  targetHebrewYear: number,
  kind: PersonalReminderKind,
  policy: YahrzeitObservancePolicy | undefined,
): string[] {
  const results: string[] = [];

  const pushAnchor = (day: number, month: HebrewMonthIdentifier, year: number) => {
    const days = daysInHebrewMonth(month, year);
    if (day > days) {
      return;
    }
    if (month === 'Adar II' && !isHebrewLeapYear(year)) {
      return;
    }
    const hd = new HDate(day, hebcalMonthNumber(month), year);
    results.push(toIsoCalendarDate(hd.greg()));
  };

  // Named Adar I / II: keep name in leap years; map to regular Adar in non-leap.
  if (isNamedAdarAnchor(anchor.month)) {
    if (isHebrewLeapYear(targetHebrewYear)) {
      pushAnchor(anchor.day, anchor.month, targetHebrewYear);
    } else {
      pushAnchor(anchor.day, 'Adar', targetHebrewYear);
    }
    return uniqueSorted(results);
  }

  // Regular Adar + yahrzeit leap policy
  if (isRegularAdarAnchor(anchor.month) && kind === 'yahrzeit') {
    if (!isHebrewLeapYear(targetHebrewYear)) {
      pushAnchor(anchor.day, 'Adar', targetHebrewYear);
      return uniqueSorted(results);
    }
    const adarPolicy = policy?.adarInLeapYear;
    if (adarPolicy === 'adar_i') {
      pushAnchor(anchor.day, 'Adar I', targetHebrewYear);
    } else if (adarPolicy === 'adar_ii') {
      pushAnchor(anchor.day, 'Adar II', targetHebrewYear);
    } else if (adarPolicy === 'both') {
      pushAnchor(anchor.day, 'Adar I', targetHebrewYear);
      pushAnchor(anchor.day, 'Adar II', targetHebrewYear);
    } else {
      // Policy missing — caller should have blocked save; do not invent.
      return [];
    }
    return uniqueSorted(results);
  }

  // Plain Adar for birthday/other: match Adar II in leap years (existing REBIID convention).
  if (isRegularAdarAnchor(anchor.month)) {
    if (isHebrewLeapYear(targetHebrewYear)) {
      pushAnchor(anchor.day, 'Adar II', targetHebrewYear);
    } else {
      pushAnchor(anchor.day, 'Adar', targetHebrewYear);
    }
    return uniqueSorted(results);
  }

  // Day-30 Cheshvan/Kislev yahrzeit policy
  if (
    kind === 'yahrzeit' &&
    anchor.day === 30 &&
    isDayThirtyAmbiguousMonth(anchor.month)
  ) {
    const days = daysInHebrewMonth(anchor.month, targetHebrewYear);
    if (days >= 30) {
      pushAnchor(30, anchor.month, targetHebrewYear);
      return uniqueSorted(results);
    }
    const thirtyPolicy = policy?.missingDayThirty;
    if (thirtyPolicy === 'day_29') {
      pushAnchor(29, anchor.month, targetHebrewYear);
    } else if (thirtyPolicy === 'first_of_next_month') {
      const next = nextMonthAfter(anchor.month, targetHebrewYear);
      pushAnchor(1, next.month, next.year);
    } else if (thirtyPolicy === 'both') {
      pushAnchor(29, anchor.month, targetHebrewYear);
      const next = nextMonthAfter(anchor.month, targetHebrewYear);
      pushAnchor(1, next.month, next.year);
    } else {
      return [];
    }
    return uniqueSorted(results);
  }

  // Standard month/day in target year
  const days = daysInHebrewMonth(anchor.month, targetHebrewYear);
  if (anchor.day <= days) {
    pushAnchor(anchor.day, anchor.month, targetHebrewYear);
  }
  return uniqueSorted(results);
}

function nextMonthAfter(
  month: HebrewMonthIdentifier,
  year: number,
): { month: HebrewMonthIdentifier; year: number } {
  // Use HDate arithmetic from day 1 of month to avoid inventing month tables twice.
  const first = new HDate(1, hebcalMonthNumber(month), year);
  const next = first.add(1, 'month');
  const anchor = hdateToHebrewAnchor(next);
  return { month: anchor.month, year: anchor.year };
}

function uniqueSorted(isoDates: string[]): string[] {
  return [...new Set(isoDates)].sort();
}

/** Explain which rule was applied for the review UI (Hebrew). */
export function explainYahrzeitRuleHe(
  kind: PersonalReminderKind,
  anchor: HebrewDateAnchor,
  targetHebrewYear: number,
  policy: YahrzeitObservancePolicy | undefined,
): string | null {
  if (kind !== 'yahrzeit') {
    return null;
  }

  if (isNamedAdarAnchor(anchor.month)) {
    if (isHebrewLeapYear(targetHebrewYear)) {
      return `נשמר ${anchor.month === 'Adar I' ? 'אדר א׳' : 'אדר ב׳'} בשנה מעוברת.`;
    }
    return 'בשנה שאינה מעוברת מציינים באדר הרגיל.';
  }

  if (isRegularAdarAnchor(anchor.month) && isHebrewLeapYear(targetHebrewYear)) {
    switch (policy?.adarInLeapYear) {
      case 'adar_i':
        return 'לפי בחירתכם: בשנה מעוברת מציינים באדר א׳.';
      case 'adar_ii':
        return 'לפי בחירתכם: בשנה מעוברת מציינים באדר ב׳.';
      case 'both':
        return 'לפי בחירתכם: בשנה מעוברת מציינים באדר א׳ ובאדר ב׳.';
      default:
        return null;
    }
  }

  if (anchor.day === 30 && isDayThirtyAmbiguousMonth(anchor.month)) {
    const days = daysInHebrewMonth(anchor.month, targetHebrewYear);
    if (days >= 30) {
      return null;
    }
    switch (policy?.missingDayThirty) {
      case 'day_29':
        return 'אין ל׳ בחודש בשנה זו — לפי בחירתכם מציינים בכ״ט.';
      case 'first_of_next_month':
        return 'אין ל׳ בחודש בשנה זו — לפי בחירתכם מציינים בא׳ בחודש הבא.';
      case 'both':
        return 'אין ל׳ בחודש בשנה זו — לפי בחירתכם מציינים בכ״ט ובא׳ בחודש הבא.';
      default:
        return null;
    }
  }

  return null;
}

/** Whether a candidate local day matches the personal/yahrzeit observance rules. */
export function personalAnchorMatchesLocalDate(
  anchor: HebrewDateAnchor,
  kind: PersonalReminderKind,
  policy: YahrzeitObservancePolicy | undefined,
  localDate: Date,
): boolean {
  const hdate = new HDate(localDate);
  const year = hdate.getFullYear();
  const iso = toIsoCalendarDate(localDate);
  const observances = resolveObservanceIsoDatesInHebrewYear(anchor, year, kind, policy);

  // Also check previous Hebrew year observances that may fall on this gregorian day
  // near Rosh Hashanah boundaries (rare but deterministic).
  const prev = resolveObservanceIsoDatesInHebrewYear(anchor, year - 1, kind, policy);
  const next = resolveObservanceIsoDatesInHebrewYear(anchor, year + 1, kind, policy);
  return observances.includes(iso) || prev.includes(iso) || next.includes(iso);
}

export function doesHebrewYearContainDayThirty(
  month: HebrewMonthIdentifier,
  year: number,
): boolean {
  return daysInHebrewMonth(month, year) >= 30;
}

/** Probe helper used by tests — construct HDate for month constants. */
export function probeMonths() {
  return { CHESHVAN: months.CHESHVAN, KISLEV: months.KISLEV, ADAR_I: months.ADAR_I };
}

export function anchorFromHDate(hdate: HDate): HebrewDateAnchor {
  return hdateToHebrewAnchor(hdate);
}

export function hdateFromAnchor(anchor: HebrewDateAnchor): HDate {
  return hebrewAnchorToHDate(anchor);
}
