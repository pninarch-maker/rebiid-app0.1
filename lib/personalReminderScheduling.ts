/**
 * Personal reminder calculation + persistence helpers.
 * Single deterministic source of truth for annual Hebrew recurrence.
 */
import { HDate } from '@hebcal/core';

import {
  applyAfterSunsetIfNeeded,
  formatGregorianIsoHe,
  formatHebrewAnchorHe,
  formatHebrewMonthDayHe,
  formatWeekdayHeFromIso,
  gregorianIsoToHebrewAnchor,
  hebrewAnchorToGregorianIso,
  isoToLocalDate,
  toIsoCalendarDate,
  validateHebrewAnchor,
  validateReminderTimeLocal,
} from '@/lib/hebrewCalendar';
import {
  CALENDAR_RULE_VERSION,
  PERSONAL_REMINDER_SCHEDULE_HORIZON_DAYS,
  PERSONAL_REMINDER_SCHEMA_VERSION,
  type HebrewDateAnchor,
  type PersonalReminderFields,
  type PersonalReminderKind,
  type PersonalReminderOccurrence,
  type PersonalReminderValidationError,
  type ReminderInputCalendar,
  type ReminderRecurrence,
  type YahrzeitObservancePolicy,
} from '@/lib/personalReminderTypes';
import {
  explainYahrzeitRuleHe,
  personalAnchorMatchesLocalDate,
  resolveObservanceIsoDatesInHebrewYear,
  validateYahrzeitPoliciesRequired,
  yahrzeitNeedsAdarPolicy,
  yahrzeitNeedsDayThirtyPolicy,
} from '@/lib/yahrzeitRules';
import type { CustomReminder } from '@/lib/settingsTypes';

export type PersonalReminderCalculation = {
  originalGregorianIso?: string;
  originalHebrew?: HebrewDateAnchor;
  effectiveHebrewAnchor: HebrewDateAnchor;
  nextOccurrences: string[];
  explanationLines: string[];
  yahrzeitRuleNote: string | null;
  errors: PersonalReminderValidationError[];
};

export type PersonalReminderDraftInput = {
  title: string;
  kind: PersonalReminderKind;
  inputCalendar: ReminderInputCalendar;
  gregorianIso?: string;
  hebrewAnchor?: HebrewDateAnchor;
  occurredAfterSunset: boolean;
  /** When user manually overrides the calculated effective Hebrew date. */
  manualEffectiveHebrewAnchor?: HebrewDateAnchor | null;
  recurrence: ReminderRecurrence;
  reminderTimeLocal: string;
  yahrzeitPolicy?: YahrzeitObservancePolicy;
  now?: Date;
  horizonDays?: number;
};

export function buildPersonalReminderCalculation(
  input: PersonalReminderDraftInput,
): PersonalReminderCalculation {
  const errors: PersonalReminderValidationError[] = [];
  const now = input.now ?? new Date();
  const horizonDays = input.horizonDays ?? PERSONAL_REMINDER_SCHEDULE_HORIZON_DAYS;

  const timeError = validateReminderTimeLocal(input.reminderTimeLocal);
  if (timeError) {
    errors.push(timeError);
  }

  if (!input.title.trim()) {
    errors.push({
      code: 'missing_title',
      messageHe: 'חסרה כותרת — תן לתזכורת שם קצר וברור.',
      field: 'title',
    });
  }

  let originalHebrew: HebrewDateAnchor | undefined;
  let originalGregorianIso: string | undefined;
  let preSunsetAnchor: HebrewDateAnchor | undefined;

  if (input.inputCalendar === 'gregorian') {
    if (!input.gregorianIso) {
      errors.push({
        code: 'missing_gregorian_year',
        messageHe: 'יש להזין יום, חודש ושנה לועזיים מלאים.',
        field: 'originalGregorianDate',
      });
    } else {
      originalGregorianIso = input.gregorianIso;
      const converted = gregorianIsoToHebrewAnchor(input.gregorianIso);
      if (!converted.ok) {
        errors.push(converted.error);
      } else {
        originalHebrew = converted.anchor;
        preSunsetAnchor = converted.anchor;
      }
    }
  } else {
    if (!input.hebrewAnchor) {
      errors.push({
        code: 'invalid_hebrew_date',
        messageHe: 'יש לבחור תאריך עברי מלא.',
        field: 'originalHebrewDate',
      });
    } else {
      const invalid = validateHebrewAnchor(input.hebrewAnchor);
      if (invalid) {
        errors.push(invalid);
      } else {
        originalHebrew = input.hebrewAnchor;
        preSunsetAnchor = input.hebrewAnchor;
        const greg = hebrewAnchorToGregorianIso(input.hebrewAnchor);
        if (greg.ok) {
          originalGregorianIso = greg.isoDate;
        }
      }
    }
  }

  let effectiveHebrewAnchor: HebrewDateAnchor | undefined;
  if (input.manualEffectiveHebrewAnchor) {
    const invalid = validateHebrewAnchor(input.manualEffectiveHebrewAnchor);
    if (invalid) {
      errors.push(invalid);
    } else {
      effectiveHebrewAnchor = input.manualEffectiveHebrewAnchor;
    }
  } else if (preSunsetAnchor) {
    effectiveHebrewAnchor = applyAfterSunsetIfNeeded(
      preSunsetAnchor,
      input.occurredAfterSunset,
    );
  }

  if (effectiveHebrewAnchor) {
    const policyError = validateYahrzeitPoliciesRequired(
      input.kind,
      effectiveHebrewAnchor,
      input.yahrzeitPolicy,
    );
    if (policyError) {
      errors.push(policyError);
    }
  }

  const nextOccurrences =
    effectiveHebrewAnchor && errors.length === 0
      ? computeUpcomingOccurrenceIsos({
          effectiveHebrewAnchor,
          kind: input.kind,
          recurrence: input.recurrence,
          policy: input.yahrzeitPolicy,
          now,
          horizonDays,
        })
      : [];

  const explanationLines: string[] = [];
  if (originalGregorianIso) {
    explanationLines.push(`התאריך הלועזי שהוזן: ${formatGregorianIsoHe(originalGregorianIso)}`);
  }
  if (originalHebrew) {
    explanationLines.push(`התאריך העברי המקביל: ${formatHebrewAnchorHe(originalHebrew)}`);
  }
  if (input.occurredAfterSunset && preSunsetAnchor && effectiveHebrewAnchor) {
    explanationLines.push(
      `לאחר שקיעה — התאריך העברי האפקטיבי: ${formatHebrewAnchorHe(effectiveHebrewAnchor)}`,
    );
  } else if (effectiveHebrewAnchor) {
    explanationLines.push(`התאריך העברי האפקטיבי: ${formatHebrewAnchorHe(effectiveHebrewAnchor)}`);
  }

  if (effectiveHebrewAnchor && input.recurrence === 'annual_hebrew') {
    explanationLines.push(
      `התזכורת תחזור מדי שנה לפי ${formatHebrewMonthDayHe(
        effectiveHebrewAnchor.day,
        effectiveHebrewAnchor.month,
      )}`,
    );
  } else if (input.recurrence === 'once') {
    explanationLines.push('תזכורת חד־פעמית — לא חוזרת מדי שנה.');
  }

  if (nextOccurrences[0]) {
    explanationLines.push(
      `המועד הקרוב: ${formatWeekdayHeFromIso(nextOccurrences[0])} ${formatGregorianIsoHe(
        nextOccurrences[0],
      )}`,
    );
  }

  const yahrzeitRuleNote =
    effectiveHebrewAnchor && nextOccurrences[0]
      ? explainYahrzeitRuleHe(
          input.kind,
          effectiveHebrewAnchor,
          (() => {
            const local = isoToLocalDate(nextOccurrences[0]);
            return local ? new HDate(local).getFullYear() : effectiveHebrewAnchor.year;
          })(),
          input.yahrzeitPolicy,
        )
      : null;

  return {
    originalGregorianIso,
    originalHebrew,
    effectiveHebrewAnchor: effectiveHebrewAnchor ?? {
      day: 1,
      month: 'Nisan',
      year: 5780,
    },
    nextOccurrences,
    explanationLines,
    yahrzeitRuleNote,
    errors,
  };
}

export function computeUpcomingOccurrenceIsos(args: {
  effectiveHebrewAnchor: HebrewDateAnchor;
  kind: PersonalReminderKind;
  recurrence: ReminderRecurrence;
  policy?: YahrzeitObservancePolicy;
  now: Date;
  horizonDays: number;
}): string[] {
  const { effectiveHebrewAnchor, kind, recurrence, policy, now, horizonDays } = args;
  const startIso = toIsoCalendarDate(now);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + horizonDays);
  const endIso = toIsoCalendarDate(end);

  if (recurrence === 'once') {
    const once = hebrewAnchorToGregorianIso(effectiveHebrewAnchor);
    if (!once.ok) {
      return [];
    }
    if (once.isoDate >= startIso && once.isoDate <= endIso) {
      return [once.isoDate];
    }
    // One-time outside horizon: still return if strictly in the future for UI "next"
    if (once.isoDate > endIso) {
      return [once.isoDate];
    }
    return [];
  }

  const found: string[] = [];
  const hNow = new HDate(now).getFullYear();

  for (let year = hNow - 1; year <= hNow + 3; year += 1) {
    const isos = resolveObservanceIsoDatesInHebrewYear(
      effectiveHebrewAnchor,
      year,
      kind,
      policy,
    );
    for (const iso of isos) {
      if (iso >= startIso) {
        found.push(iso);
      }
    }
  }

  const unique = [...new Set(found)].sort();
  return unique.filter((iso) => iso <= endIso).length > 0
    ? unique.filter((iso) => iso <= endIso)
    : unique.slice(0, 2);
}

export function buildScheduledOccurrences(
  reminderId: string,
  gregorianDates: string[],
): PersonalReminderOccurrence[] {
  return gregorianDates.map((gregorianDate) => ({
    occurrenceId: `${reminderId}:${gregorianDate}`,
    gregorianDate,
    notificationId: `${gregorianDate}-personal-${reminderId}`,
  }));
}

export function personalReminderMatchesLocalDate(
  reminder: CustomReminder,
  localDate: Date,
): boolean {
  const fields = getPersonalFields(reminder);
  if (!fields) {
    // Legacy annual month/day match is handled by caller with hdateMatchesEnglishMonth.
    return false;
  }

  if (fields.recurrence === 'once') {
    const once = hebrewAnchorToGregorianIso(fields.effectiveHebrewAnchor);
    if (!once.ok) {
      return false;
    }
    return once.isoDate === toIsoCalendarDate(localDate);
  }

  return personalAnchorMatchesLocalDate(
    fields.effectiveHebrewAnchor,
    fields.kind,
    fields.yahrzeitPolicy,
    localDate,
  );
}

export function getPersonalFields(
  reminder: CustomReminder,
): PersonalReminderFields | null {
  if (reminder.schemaVersion == null || !reminder.effectiveHebrewAnchor) {
    return null;
  }
  return {
    schemaVersion: reminder.schemaVersion,
    kind: reminder.kind ?? 'other',
    inputCalendar: reminder.inputCalendar ?? 'hebrew',
    originalGregorianDate: reminder.originalGregorianDate,
    originalHebrewDate: reminder.originalHebrewDate,
    occurredAfterSunset: reminder.occurredAfterSunset ?? false,
    effectiveHebrewAnchor: reminder.effectiveHebrewAnchor,
    recurrence: reminder.recurrence ?? 'annual_hebrew',
    reminderTimeLocal: reminder.reminderTimeLocal ?? reminder.time,
    yahrzeitPolicy: reminder.yahrzeitPolicy,
    calendarRuleVersion: reminder.calendarRuleVersion ?? CALENDAR_RULE_VERSION,
    scheduledOccurrences: reminder.scheduledOccurrences ?? [],
    createdAt: reminder.createdAt ?? new Date(0).toISOString(),
    updatedAt: reminder.updatedAt ?? new Date(0).toISOString(),
  };
}

export function isLegacyPersonalReminder(reminder: CustomReminder): boolean {
  return reminder.schemaVersion == null || reminder.effectiveHebrewAnchor == null;
}

export function migrateLegacyCustomReminder(reminder: CustomReminder): CustomReminder {
  if (!isLegacyPersonalReminder(reminder)) {
    return reminder;
  }

  const nowIso = new Date().toISOString();
  const currentYear = new HDate().getFullYear();

  const effectiveHebrewAnchor: HebrewDateAnchor = {
    day: reminder.hebrewDay,
    month: reminder.hebrewMonth as HebrewDateAnchor['month'],
    year: currentYear,
  };

  return {
    ...reminder,
    schemaVersion: PERSONAL_REMINDER_SCHEMA_VERSION,
    kind: reminder.category === 'minhag_segulah' ? 'other' : (reminder.kind ?? 'other'),
    inputCalendar: 'hebrew',
    originalHebrewDate: effectiveHebrewAnchor,
    occurredAfterSunset: false,
    effectiveHebrewAnchor,
    recurrence: 'annual_hebrew',
    reminderTimeLocal: reminder.time || '09:00',
    calendarRuleVersion: CALENDAR_RULE_VERSION,
    scheduledOccurrences: reminder.scheduledOccurrences ?? [],
    createdAt: reminder.createdAt ?? nowIso,
    updatedAt: reminder.updatedAt ?? nowIso,
  };
}

export function buildCustomReminderFromDraft(args: {
  id: string;
  title: string;
  message: string;
  enabled: boolean;
  reminderOffsetMinutes: number;
  category?: 'personal' | 'minhag_segulah';
  draft: PersonalReminderDraftInput;
  existing?: CustomReminder | null;
  now?: Date;
}): { reminder: CustomReminder; errors: PersonalReminderValidationError[] } {
  const calc = buildPersonalReminderCalculation(args.draft);
  if (calc.errors.length > 0) {
    return { reminder: args.existing ?? ({} as CustomReminder), errors: calc.errors };
  }

  const now = args.now ?? new Date();
  const nowIso = now.toISOString();
  const scheduledOccurrences = buildScheduledOccurrences(
    args.id,
    calc.nextOccurrences.filter((iso) => {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + PERSONAL_REMINDER_SCHEDULE_HORIZON_DAYS);
      return iso <= toIsoCalendarDate(end);
    }),
  );

  const reminder: CustomReminder = {
    id: args.id,
    title: args.title.trim(),
    message: args.message.trim(),
    hebrewMonth: calc.effectiveHebrewAnchor.month,
    hebrewDay: calc.effectiveHebrewAnchor.day,
    time: args.draft.reminderTimeLocal,
    enabled: args.enabled,
    reminderOffsetMinutes: args.reminderOffsetMinutes,
    category: args.category ?? 'personal',
    schemaVersion: PERSONAL_REMINDER_SCHEMA_VERSION,
    kind: args.draft.kind,
    inputCalendar: args.draft.inputCalendar,
    originalGregorianDate: calc.originalGregorianIso
      ? { isoDate: calc.originalGregorianIso }
      : undefined,
    originalHebrewDate: calc.originalHebrew,
    occurredAfterSunset: args.draft.occurredAfterSunset,
    effectiveHebrewAnchor: calc.effectiveHebrewAnchor,
    recurrence: args.draft.recurrence,
    reminderTimeLocal: args.draft.reminderTimeLocal,
    yahrzeitPolicy: args.draft.yahrzeitPolicy,
    calendarRuleVersion: CALENDAR_RULE_VERSION,
    scheduledOccurrences,
    createdAt: args.existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  return { reminder, errors: [] };
}

export function needsAdarPolicyChoice(
  kind: PersonalReminderKind,
  anchor: HebrewDateAnchor | undefined,
): boolean {
  return !!anchor && yahrzeitNeedsAdarPolicy(kind, anchor);
}

export function needsDayThirtyPolicyChoice(
  kind: PersonalReminderKind,
  anchor: HebrewDateAnchor | undefined,
): boolean {
  return !!anchor && yahrzeitNeedsDayThirtyPolicy(kind, anchor);
}

export function personalReminderOwnedNotificationIds(reminder: CustomReminder): string[] {
  const scheduled = reminder.scheduledOccurrences ?? [];
  if (scheduled.length > 0) {
    return scheduled.map((item) => item.notificationId);
  }
  return [];
}

/** Platform limitation note for UI / docs — do not claim unlimited annual reliability offline. */
export const PERSONAL_REMINDER_HORIZON_LIMITATION_HE =
  'תזכורות שנתיות מתוזמנות מראש ל־30 הימים הקרובים. REBIID מרענן את התזמון בפתיחת האפליקציה, בחזרה אליה, בעריכת תזכורת ובשינוי מצב ההתראות.';
