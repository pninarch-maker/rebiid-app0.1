/**
 * Fast-day date separation, halachic timing, and tzeit integrity checks.
 * Run: npm run test:fast-days
 */
import { DEFAULT_APP_SETTINGS } from '../lib/settingsTypes';
import { setCurrentAppSettings } from '../lib/appState';
import { getDefaultReminderEngineSettings } from '../src/engine/reminders/defaultSettings';
import { getAppRemindersForDay } from '../src/engine/reminders/ruleEngine';
import {
  getEventTimeForReminder,
  getNotificationTriggerDate,
  toUpcomingReminder,
} from '../lib/reminderTiming';
import { getZmanim } from '../src/engine/zmanim';

const engineSettings = {
  ...getDefaultReminderEngineSettings(true),
  disabledBuiltInReminderIds: [] as string[],
};

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function day(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

function ruleIdsOn(date: string): string[] {
  return getAppRemindersForDay(day(date), engineSettings, [])
    .map((reminder) => reminder.ruleId)
    .filter((id): id is string => Boolean(id));
}

function hasRule(date: string, ruleId: string): boolean {
  return ruleIdsOn(date).includes(ruleId);
}

setCurrentAppSettings({ ...DEFAULT_APP_SETTINGS });

// --- Tisha B'Av 5786 (22.07 eve, 23.07 end) ---
assert(
  'Tisha BAv 5786 eve (22.07): fast begins, no fast ends',
  hasRule('2026-07-22', 'tisha_bav_fast_begins') &&
    !hasRule('2026-07-22', 'tisha_bav_fast_ends'),
);

assert(
  'Tisha BAv 5786 day (23.07): fast ends, no fast begins',
  hasRule('2026-07-23', 'tisha_bav_fast_ends') &&
    !hasRule('2026-07-23', 'tisha_bav_fast_begins'),
);

const tishaEve = getAppRemindersForDay(day('2026-07-22'), engineSettings, []).find(
  (r) => r.ruleId === 'tisha_bav_fast_begins',
)!;
const tishaEnd = getAppRemindersForDay(day('2026-07-23'), engineSettings, []).find(
  (r) => r.ruleId === 'tisha_bav_fast_ends',
)!;
const eveUp = toUpcomingReminder(tishaEve, day('2026-07-22'));
const endUp = toUpcomingReminder(tishaEnd, day('2026-07-23'));
const eveZmanim = getZmanim(day('2026-07-22'));
const endZmanim = getZmanim(day('2026-07-23'));

assert(
  'Tisha BAv eve notification at sunset',
  getEventTimeForReminder(eveUp, DEFAULT_APP_SETTINGS).toTimeString().slice(0, 5) ===
    eveZmanim.sunset,
);

assert(
  'Tisha BAv end notification at tzeit (no category advance shift)',
  getNotificationTriggerDate(endUp, DEFAULT_APP_SETTINGS)!.toTimeString().slice(0, 5) ===
    endZmanim.tzeit,
);

assert(
  'Tisha BAv start precedes end on calendar',
  getEventTimeForReminder(eveUp, DEFAULT_APP_SETTINGS).getTime() <
    getEventTimeForReminder(endUp, DEFAULT_APP_SETTINGS).getTime(),
);

// --- Minor fast: Tzom Tammuz 5786 ---
assert(
  'Tzom Tammuz 5786 (02.07): begins and ends same day',
  hasRule('2026-07-02', 'seventeenth_tammuz_begins') &&
    hasRule('2026-07-02', 'seventeenth_tammuz_ends'),
);

const tammuzBegins = getAppRemindersForDay(day('2026-07-02'), engineSettings, []).find(
  (r) => r.ruleId === 'seventeenth_tammuz_begins',
)!;
const tammuzEnds = getAppRemindersForDay(day('2026-07-02'), engineSettings, []).find(
  (r) => r.ruleId === 'seventeenth_tammuz_ends',
)!;
const tammuzZmanim = getZmanim(day('2026-07-02'));

assert(
  'Tzom Tammuz begins at alot hashachar',
  getEventTimeForReminder(
    toUpcomingReminder(tammuzBegins, day('2026-07-02')),
    DEFAULT_APP_SETTINGS,
  )
    .toTimeString()
    .slice(0, 5) === tammuzZmanim.alotHashachar,
);

assert(
  'Tzom Tammuz ends at tzeit',
  getEventTimeForReminder(
    toUpcomingReminder(tammuzEnds, day('2026-07-02')),
    DEFAULT_APP_SETTINGS,
  )
    .toTimeString()
    .slice(0, 5) === tammuzZmanim.tzeit,
);

// --- Postponed Tisha B'Av 5789 (9 Av on Shabbat -> observed 10 Av Sunday) ---
assert(
  'Postponed Tisha BAv 5789 Shabbat (21.07): fast begins at erev, no fast ends',
  hasRule('2029-07-21', 'tisha_bav_fast_begins') &&
    !hasRule('2029-07-21', 'tisha_bav_fast_ends'),
);

assert(
  'Postponed Tisha BAv 5789 observed Sunday (22.07): fast ends, no fast begins',
  !hasRule('2029-07-22', 'tisha_bav_fast_begins') &&
    hasRule('2029-07-22', 'tisha_bav_fast_ends'),
);

// --- tzeit never equals havdalah on a weekday fast ---
const yomKippurZmanim = getZmanim(day('2025-10-02'));
assert(
  'Yom Kippur 5786: tzeit is independent of havdalah on weekday',
  Boolean(yomKippurZmanim.tzeit) &&
    yomKippurZmanim.tzeit !== yomKippurZmanim.havdalah,
);

// --- Dedup keys include phase ---
const dedupeKeys = getAppRemindersForDay(day('2026-07-22'), engineSettings, []).map(
  (r) => `${r.date}-${r.ruleId}`,
);
assert(
  'No duplicate rule ids on Tisha BAv eve',
  new Set(dedupeKeys).size === dedupeKeys.length,
);

console.log('All fast-day checks passed.');
