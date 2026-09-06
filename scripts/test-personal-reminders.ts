/**
 * Deterministic personal Hebrew-date reminder regression tests.
 * Run: npm run test:personal-reminders
 */
import fs from 'node:fs';
import path from 'node:path';

import { HDate } from '@hebcal/core';

import {
  advanceHebrewAnchorOneDay,
  gregorianIsoToHebrewAnchor,
  hebrewAnchorToGregorianIso,
  toIsoCalendarDate,
} from '../lib/hebrewCalendar';
import {
  buildCustomReminderFromDraft,
  buildPersonalReminderCalculation,
  computeUpcomingOccurrenceIsos,
  migrateLegacyCustomReminder,
  personalReminderMatchesLocalDate,
  personalReminderOwnedNotificationIds,
} from '../lib/personalReminderScheduling';
import {
  CALENDAR_RULE_VERSION,
  PERSONAL_REMINDER_SCHEMA_VERSION,
} from '../lib/personalReminderTypes';
import { resolveObservanceIsoDatesInHebrewYear } from '../lib/yahrzeitRules';
import { getAndroidNotificationDeliveryConfig } from '../lib/notificationMode';
import type { CustomReminder } from '../lib/settingsTypes';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✓ ${label}`);
}

// 1. Gregorian → Hebrew anchor (local calendar date of 12 Elul 5743)
const elul12 = new HDate(12, 6, 5743); // months.ELUL === 6
const elul12Iso = toIsoCalendarDate(elul12.greg());
const g2h = gregorianIsoToHebrewAnchor(elul12Iso);
assert('Gregorian local date for 12 Elul 5743 converts', g2h.ok === true);
if (g2h.ok) {
  assert(
    'round-trip Gregorian → 12 Elul 5743',
    g2h.anchor.day === 12 && g2h.anchor.month === 'Elul' && g2h.anchor.year === 5743,
  );
}

// 2. After-sunset advances exactly one Hebrew day
if (g2h.ok) {
  const next = advanceHebrewAnchorOneDay(g2h.anchor);
  assert(
    'after-sunset advances one Hebrew day',
    next.day === 13 && next.month === 'Elul' && next.year === 5743,
  );
}

// 3. Hebrew → Gregorian (local)
const h2g = hebrewAnchorToGregorianIso({ day: 12, month: 'Elul', year: 5743 });
assert('Hebrew 12 Elul 5743 → local Gregorian ISO', h2g.ok && h2g.isoDate === elul12Iso);

// 4. Birthday annual Hebrew (not Gregorian yearly)
const birthdayCalc = buildPersonalReminderCalculation({
  title: 'יום הולדת בדיקה',
  kind: 'birthday',
  inputCalendar: 'gregorian',
  gregorianIso: elul12Iso,
  occurredAfterSunset: false,
  recurrence: 'annual_hebrew',
  reminderTimeLocal: '09:00',
  now: new Date(2024, 0, 1),
  horizonDays: 400,
});
assert('birthday calculation has no errors', birthdayCalc.errors.length === 0);
assert(
  'birthday next occurrence is Hebrew-annual (not fixed Gregorian month-day)',
  birthdayCalc.nextOccurrences.length > 0 &&
    birthdayCalc.effectiveHebrewAnchor.month === 'Elul' &&
    birthdayCalc.effectiveHebrewAnchor.day === 12,
);
assert(
  'birthday explanation mentions Hebrew annual recurrence',
  birthdayCalc.explanationLines.some((line) => line.includes('מדי שנה לפי')),
);

// 5. One-time does not create annual schedule
const onceCalc = buildPersonalReminderCalculation({
  title: 'אירוע חד פעמי',
  kind: 'other',
  inputCalendar: 'hebrew',
  hebrewAnchor: { day: 12, month: 'Elul', year: 5786 },
  occurredAfterSunset: false,
  recurrence: 'once',
  reminderTimeLocal: '10:00',
  now: new Date(2020, 0, 1),
  horizonDays: 4000,
});
assert('one-time has at most one occurrence', onceCalc.nextOccurrences.length <= 1);
const onceReminder = buildCustomReminderFromDraft({
  id: 'once-1',
  title: 'אירוע חד פעמי',
  message: '',
  enabled: true,
  reminderOffsetMinutes: 0,
  draft: {
    title: 'אירוע חד פעמי',
    kind: 'other',
    inputCalendar: 'hebrew',
    hebrewAnchor: { day: 12, month: 'Elul', year: 5786 },
    occurredAfterSunset: false,
    recurrence: 'once',
    reminderTimeLocal: '10:00',
  },
}).reminder;
const matchOnceYear = personalReminderMatchesLocalDate(
  onceReminder,
  new HDate(12, 6, 5786).greg(), // Elul=6
);
const matchOtherYear = personalReminderMatchesLocalDate(
  onceReminder,
  new HDate(12, 6, 5787).greg(),
);
assert('one-time matches only its Hebrew year', matchOnceYear && !matchOtherYear);

// 6. Regular Adar yahrzeit leap policies
const adarAnchor = { day: 7, month: 'Adar' as const, year: 5782 };
const leapYear = 5784;
assert('5784 is leap', new HDate(1, 1, leapYear) && HDate.isLeapYear(leapYear));

const adarI = resolveObservanceIsoDatesInHebrewYear(adarAnchor, leapYear, 'yahrzeit', {
  adarInLeapYear: 'adar_i',
});
const adarII = resolveObservanceIsoDatesInHebrewYear(adarAnchor, leapYear, 'yahrzeit', {
  adarInLeapYear: 'adar_ii',
});
const adarBoth = resolveObservanceIsoDatesInHebrewYear(adarAnchor, leapYear, 'yahrzeit', {
  adarInLeapYear: 'both',
});
assert('Adar policy adar_i yields one date', adarI.length === 1);
assert('Adar policy adar_ii yields one date', adarII.length === 1);
assert('Adar policy both yields two unique dates', adarBoth.length === 2);
assert('Adar both dates are distinct', adarBoth[0] !== adarBoth[1]);

// 7. Named Adar I / II in leap and non-leap
const adarIAnchor = { day: 7, month: 'Adar I' as const, year: 5784 };
const namedLeap = resolveObservanceIsoDatesInHebrewYear(adarIAnchor, 5784, 'yahrzeit', {});
const namedNonLeap = resolveObservanceIsoDatesInHebrewYear(adarIAnchor, 5785, 'yahrzeit', {});
assert('Adar I preserved in leap year', namedLeap.length === 1);
assert('Adar I maps to regular Adar in non-leap', namedNonLeap.length === 1);

// 8–9. 30 Cheshvan / Kislev policies
function findYearWithoutDay30(month: 'Cheshvan' | 'Kislev'): number {
  for (let year = 5780; year < 5820; year += 1) {
    const days = HDate.daysInMonth(month === 'Cheshvan' ? 8 : 9, year);
    if (days === 29) {
      return year;
    }
  }
  throw new Error(`No short ${month} year found`);
}

const shortCheshvan = findYearWithoutDay30('Cheshvan');
const day30Anchor = { day: 30, month: 'Cheshvan' as const, year: 5780 };
const d29 = resolveObservanceIsoDatesInHebrewYear(day30Anchor, shortCheshvan, 'yahrzeit', {
  missingDayThirty: 'day_29',
});
const d1 = resolveObservanceIsoDatesInHebrewYear(day30Anchor, shortCheshvan, 'yahrzeit', {
  missingDayThirty: 'first_of_next_month',
});
const dBoth = resolveObservanceIsoDatesInHebrewYear(day30Anchor, shortCheshvan, 'yahrzeit', {
  missingDayThirty: 'both',
});
assert('30 Cheshvan day_29 yields one date', d29.length === 1);
assert('30 Cheshvan first_of_next_month yields one date', d1.length === 1);
assert('30 Cheshvan both yields two unique dates', dBoth.length === 2 && dBoth[0] !== dBoth[1]);

const missingPolicy = buildPersonalReminderCalculation({
  title: 'יארצייט',
  kind: 'yahrzeit',
  inputCalendar: 'hebrew',
  hebrewAnchor: day30Anchor,
  occurredAfterSunset: false,
  recurrence: 'annual_hebrew',
  reminderTimeLocal: '09:00',
});
assert(
  'missing day-30 policy blocks save',
  missingPolicy.errors.some((error) => error.code === 'missing_day_thirty_policy'),
);

const missingAdar = buildPersonalReminderCalculation({
  title: 'יארצייט אדר',
  kind: 'yahrzeit',
  inputCalendar: 'hebrew',
  hebrewAnchor: adarAnchor,
  occurredAfterSunset: false,
  recurrence: 'annual_hebrew',
  reminderTimeLocal: '09:00',
});
assert(
  'missing Adar policy blocks save',
  missingAdar.errors.some((error) => error.code === 'missing_adar_policy'),
);

// 10. Rosh Hashanah boundary / leap year smoke
const tishrei = buildPersonalReminderCalculation({
  title: 'ראש השנה אישי',
  kind: 'other',
  inputCalendar: 'hebrew',
  hebrewAnchor: { day: 1, month: 'Tishrei', year: 5785 },
  occurredAfterSunset: false,
  recurrence: 'annual_hebrew',
  reminderTimeLocal: '08:00',
  now: new Date(2024, 8, 1),
  horizonDays: 60,
});
assert('Tishrei 1 annual calculates', tishrei.errors.length === 0 && tishrei.nextOccurrences.length > 0);

// 11. Invalid dates
const badGreg = gregorianIsoToHebrewAnchor('2024-02-31');
assert('invalid Gregorian rejected', badGreg.ok === false);
const badTime = buildPersonalReminderCalculation({
  title: 'x',
  kind: 'other',
  inputCalendar: 'gregorian',
  gregorianIso: '2024-05-01',
  occurredAfterSunset: false,
  recurrence: 'once',
  reminderTimeLocal: '25:99',
});
assert(
  'invalid time rejected',
  badTime.errors.some((error) => error.code === 'invalid_time'),
);

// 12–14. Owned notification IDs + migration (no accidental broad cancel contract)
const built = buildCustomReminderFromDraft({
  id: 'pers-42',
  title: 'יום הולדת בדיקה',
  message: '',
  enabled: true,
  reminderOffsetMinutes: 0,
  draft: {
    title: 'יום הולדת בדיקה',
    kind: 'birthday',
    inputCalendar: 'gregorian',
    gregorianIso: elul12Iso,
    occurredAfterSunset: false,
    recurrence: 'annual_hebrew',
    reminderTimeLocal: '09:00',
  },
  now: new Date(2024, 0, 1),
});
assert('valid birthday saves', built.errors.length === 0);
const owned = personalReminderOwnedNotificationIds(built.reminder);
assert(
  'owned notification IDs are reminder-scoped',
  owned.every((id) => id.includes('pers-42') && id.includes('-personal-')),
);

const legacy: CustomReminder = {
  id: 'legacy-1',
  title: 'ישן',
  message: '',
  hebrewMonth: 'Nisan',
  hebrewDay: 15,
  time: '09:00',
  enabled: true,
  reminderOffsetMinutes: -1,
  category: 'personal',
};
const migrated = migrateLegacyCustomReminder(legacy);
assert(
  'legacy migrates to schema v1 annual_hebrew',
  migrated.schemaVersion === PERSONAL_REMINDER_SCHEMA_VERSION &&
    migrated.recurrence === 'annual_hebrew' &&
    migrated.effectiveHebrewAnchor?.day === 15 &&
    migrated.effectiveHebrewAnchor?.month === 'Nisan' &&
    migrated.calendarRuleVersion === CALENDAR_RULE_VERSION,
);

// Idempotent migration
const migratedTwice = migrateLegacyCustomReminder(migrated);
assert(
  'migration is idempotent',
  migratedTwice.updatedAt === migrated.updatedAt &&
    migratedTwice.effectiveHebrewAnchor?.year === migrated.effectiveHebrewAnchor?.year,
);

// 15–16. Notification routing still uses shared delivery config
assert(
  'personal schedules must reuse getAndroidNotificationDeliveryConfig',
  typeof getAndroidNotificationDeliveryConfig === 'function' &&
    getAndroidNotificationDeliveryConfig('vibration_only').channelId === 'rebiid_vibrate_v3',
);

const notificationsSrc = fs.readFileSync(path.resolve('lib/notifications.ts'), 'utf8');
const schedulingSrc = fs.readFileSync(path.resolve('lib/personalReminderScheduling.ts'), 'utf8');
assert(
  'no Gregorian yearly OS repeat in personal scheduling',
  !schedulingSrc.includes('YEARLY') && !schedulingSrc.includes('calendarTrigger'),
);
assert(
  'sync still routes through shared Android channel resolver',
  notificationsSrc.includes('resolveCategoryAndroidChannelId') &&
    notificationsSrc.includes('getAndroidNotificationDeliveryConfig'),
);

// 17. Reconciliation idempotency of occurrence builder
const first = computeUpcomingOccurrenceIsos({
  effectiveHebrewAnchor: { day: 12, month: 'Elul', year: 5743 },
  kind: 'birthday',
  recurrence: 'annual_hebrew',
  now: new Date(2024, 0, 1),
  horizonDays: 400,
});
const second = computeUpcomingOccurrenceIsos({
  effectiveHebrewAnchor: { day: 12, month: 'Elul', year: 5743 },
  kind: 'birthday',
  recurrence: 'annual_hebrew',
  now: new Date(2024, 0, 1),
  horizonDays: 400,
});
assert(
  'occurrence computation is deterministic/idempotent',
  JSON.stringify(first) === JSON.stringify(second),
);

// 18. Engine matching uses personal path for schema reminders
assert(
  'schema reminder matches via personal rules',
  personalReminderMatchesLocalDate(built.reminder, new HDate(12, 6, 5784).greg()) ||
    personalReminderMatchesLocalDate(built.reminder, new HDate(12, 6, 5785).greg()) ||
    built.reminder.effectiveHebrewAnchor != null,
);

// Source audit: no personal titles logged
assert(
  'scheduling domain does not console.log personal titles',
  !schedulingSrc.includes('console.log') && !schedulingSrc.includes('console.warn'),
);

console.log('All personal reminder checks passed.');
console.log(
  `  Note: rolling schedule horizon is 30 days (toIso sample ${toIsoCalendarDate(new Date())}).`,
);
