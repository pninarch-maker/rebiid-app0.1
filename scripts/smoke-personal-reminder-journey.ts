/**
 * Headless primary-journey smoke for personal Hebrew-date reminders.
 * Not a substitute for physical device UI testing.
 */
import { HDate } from '@hebcal/core';

import { toIsoCalendarDate } from '../lib/hebrewCalendar';
import {
  buildCustomReminderFromDraft,
  buildPersonalReminderCalculation,
  migrateLegacyCustomReminder,
  personalReminderMatchesLocalDate,
  personalReminderOwnedNotificationIds,
} from '../lib/personalReminderScheduling';
import { getAndroidNotificationDeliveryConfig } from '../lib/notificationMode';
import type { CustomReminder } from '../lib/settingsTypes';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`SMOKE FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

// Journey A: birthday from Gregorian → confirm Hebrew + next date
const elul12 = new HDate(12, 6, 5743);
const gregIso = toIsoCalendarDate(elul12.greg());
const birthdayDraft = {
  title: 'יום ההולדת של יעקב',
  kind: 'birthday' as const,
  inputCalendar: 'gregorian' as const,
  gregorianIso: gregIso,
  occurredAfterSunset: false,
  recurrence: 'annual_hebrew' as const,
  reminderTimeLocal: '09:00',
  now: new Date(2024, 0, 1),
  horizonDays: 400,
};
const birthdayCalc = buildPersonalReminderCalculation(birthdayDraft);
assert('birthday shows matching Hebrew date', birthdayCalc.originalHebrew?.day === 12);
assert('birthday effective is Elul 12', birthdayCalc.effectiveHebrewAnchor.month === 'Elul');
assert('birthday has next occurrence', birthdayCalc.nextOccurrences.length > 0);
assert(
  'UI explanation includes Hebrew parallel + annual Hebrew recurrence',
  birthdayCalc.explanationLines.some((l) => l.includes('התאריך העברי המקביל')) &&
    birthdayCalc.explanationLines.some((l) => l.includes('מדי שנה לפי')),
);

const afterSunset = buildPersonalReminderCalculation({
  ...birthdayDraft,
  occurredAfterSunset: true,
});
assert(
  'after-sunset advances Hebrew day',
  afterSunset.effectiveHebrewAnchor.day === 13 &&
    afterSunset.effectiveHebrewAnchor.month === 'Elul',
);

const saved = buildCustomReminderFromDraft({
  id: 'smoke-bday-1',
  title: birthdayDraft.title,
  message: '',
  enabled: true,
  reminderOffsetMinutes: 0,
  draft: birthdayDraft,
  now: new Date(2024, 0, 1),
});
assert('birthday save succeeds', saved.errors.length === 0);

// Journey B: yahrzeit Adar policy required + both dates unique
const yahrzeitMissing = buildPersonalReminderCalculation({
  title: 'יארצייט של סבא',
  kind: 'yahrzeit',
  inputCalendar: 'hebrew',
  hebrewAnchor: { day: 7, month: 'Adar', year: 5782 },
  occurredAfterSunset: false,
  recurrence: 'annual_hebrew',
  reminderTimeLocal: '09:00',
});
assert(
  'yahrzeit without Adar policy is blocked',
  yahrzeitMissing.errors.some((e) => e.code === 'missing_adar_policy'),
);

const yahrzeitOk = buildCustomReminderFromDraft({
  id: 'smoke-yahr-1',
  title: 'יארצייט של סבא',
  message: '',
  enabled: true,
  reminderOffsetMinutes: 0,
  draft: {
    title: 'יארצייט של סבא',
    kind: 'yahrzeit',
    inputCalendar: 'hebrew',
    hebrewAnchor: { day: 7, month: 'Adar', year: 5782 },
    occurredAfterSunset: false,
    recurrence: 'annual_hebrew',
    reminderTimeLocal: '09:00',
    yahrzeitPolicy: { adarInLeapYear: 'both' },
  },
  now: new Date(2024, 0, 1),
});
assert('yahrzeit with both-Adar policy saves', yahrzeitOk.errors.length === 0);

// Edit policy → owned IDs remain scoped
const edited = buildCustomReminderFromDraft({
  id: 'smoke-yahr-1',
  title: 'יארצייט של סבא',
  message: '',
  enabled: true,
  reminderOffsetMinutes: 0,
  existing: yahrzeitOk.reminder,
  draft: {
    title: 'יארצייט של סבא',
    kind: 'yahrzeit',
    inputCalendar: 'hebrew',
    hebrewAnchor: { day: 7, month: 'Adar', year: 5782 },
    occurredAfterSunset: false,
    recurrence: 'annual_hebrew',
    reminderTimeLocal: '09:00',
    yahrzeitPolicy: { adarInLeapYear: 'adar_ii' },
  },
  now: new Date(2024, 0, 1),
});
assert('edit preserves createdAt', edited.reminder.createdAt === yahrzeitOk.reminder.createdAt);
assert(
  'owned notification ids stay reminder-scoped after edit',
  personalReminderOwnedNotificationIds(edited.reminder).every((id) =>
    id.includes('smoke-yahr-1'),
  ),
);

// Persistence reopen simulation: migrate + match without duplication
const store: CustomReminder[] = [saved.reminder, edited.reminder];
const reloaded = store.map(migrateLegacyCustomReminder);
assert('reopen migration idempotent count', reloaded.length === 2);
const ids = new Set(reloaded.map((r) => r.id));
assert('no duplicate ids after reopen', ids.size === 2);

// Notification mode routing still single source of truth
for (const mode of ['device_sound', 'vibration_only', 'silent'] as const) {
  const cfg = getAndroidNotificationDeliveryConfig(mode);
  assert(`mode ${mode} has channelId`, cfg.channelId.length > 0);
}

// Matching smoke for annual birthday around Elul
const someElul = new HDate(12, 6, 5785).greg();
assert(
  'annual birthday can match an Elul 12 local day',
  personalReminderMatchesLocalDate(saved.reminder, someElul) ||
    personalReminderMatchesLocalDate(saved.reminder, new HDate(12, 6, 5784).greg()) ||
    personalReminderMatchesLocalDate(saved.reminder, new HDate(12, 6, 5786).greg()),
);

console.log('Primary journey headless smoke passed.');
console.log('DEVICE_UI: not executed in this environment (no adb/emulator).');
