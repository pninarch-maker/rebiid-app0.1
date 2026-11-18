/**
 * Local notification planning checks: same-minute merge, iOS cap, past filter.
 * Runs the planner against the real reminder engine across a full year.
 * Run: npm run test:notification-plan
 */
import { currentAppSettings } from '../lib/appState';
import {
  MAX_SCHEDULED_NOTIFICATIONS,
  planNotifications,
  type PlannableReminder,
} from '../lib/notificationPlan';
import { getNotificationTriggerDate } from '../lib/reminderTiming';
import { getUpcomingRemindersSync } from '../src/engine/reminders/getUpcomingReminders';

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✓ ${label}`);
}

// ---------- unit checks ----------
const now = new Date('2026-12-01T10:00:00').getTime();
const at = (iso: string) => new Date(iso);
const r = (id: string, severity: 'info' | 'important' = 'info'): PlannableReminder => ({
  id,
  title: `title-${id}`,
  message: `msg-${id}`,
  severity,
});

const merged = planNotifications(
  [
    { reminder: r('a'), triggerDate: at('2026-12-10T08:00:00') },
    { reminder: r('b', 'important'), triggerDate: at('2026-12-10T08:00:30') },
    { reminder: r('c'), triggerDate: at('2026-12-10T08:00:00') },
  ],
  now,
);
assert('same-minute reminders merge into one notification', merged.length === 1);
assert('important reminder becomes the headline', merged[0].primary.id === 'b');
assert('merged title mentions the extra count', merged[0].title === 'title-b · ועוד 2');
assert('merged body keeps every message', merged[0].body.split('\n').length === 3);

const channels = planNotifications(
  [
    { reminder: r('a'), triggerDate: at('2026-12-10T08:00:00'), groupKey: 'sound' },
    { reminder: r('b'), triggerDate: at('2026-12-10T08:00:00'), groupKey: 'silent' },
  ],
  now,
);
assert('different channels are not merged', channels.length === 2);

const past = planNotifications(
  [
    { reminder: r('old'), triggerDate: at('2026-11-30T08:00:00') },
    { reminder: r('none'), triggerDate: null },
    { reminder: r('dup'), triggerDate: at('2026-12-05T08:00:00') },
    { reminder: r('dup'), triggerDate: at('2026-12-06T08:00:00') },
  ],
  now,
);
assert('past / missing triggers dropped and duplicate ids skipped', past.length === 1);

const many = planNotifications(
  Array.from({ length: 100 }, (_, i) => ({
    reminder: r(`n${i}`),
    triggerDate: new Date(now + (100 - i) * 3600_000),
  })),
  now,
);
assert(`cap keeps at most ${MAX_SCHEDULED_NOTIFICATIONS}`, many.length === MAX_SCHEDULED_NOTIFICATIONS);
assert(
  'cap keeps the soonest notifications, sorted',
  many[0].primary.id === 'n99' &&
    many.every((p, i) => i === 0 || p.triggerDate >= many[i - 1].triggerDate),
);

// ---------- real engine, full year ----------
function planFrom(start: Date) {
  const startMs = start.getTime();
  return planNotifications(
    getUpcomingRemindersSync(30, start).map((reminder) => ({
      reminder,
      triggerDate: getNotificationTriggerDate(reminder, currentAppSettings),
    })),
    startMs,
  );
}

const roshChodeshTevet = planFrom(new Date('2026-11-18T12:00:00')).filter(
  (p) => p.triggerDate.toDateString() === new Date('2026-12-10T12:00:00').toDateString(),
);
const tevetAt8 = roshChodeshTevet.filter((p) => p.triggerDate.getHours() === 8);
assert(
  `Rosh Chodesh Tevet 08:00 alerts merged (${tevetAt8[0]?.reminders.length ?? 0} reminders → ${tevetAt8.length} notification)`,
  tevetAt8.length === 1 && tevetAt8[0].reminders.length >= 2,
);

let maxCount = 0;
let sameMinuteViolations = 0;
for (let d = 0; d < 365; d += 2) {
  const start = new Date('2026-11-18T12:00:00');
  start.setDate(start.getDate() + d);
  const plan = planFrom(start);
  maxCount = Math.max(maxCount, plan.length);
  const minutes = new Set<number>();
  for (const p of plan) {
    const m = Math.floor(p.triggerDate.getTime() / 60000);
    if (minutes.has(m)) sameMinuteViolations += 1;
    minutes.add(m);
  }
}
assert(`full year: never more than ${MAX_SCHEDULED_NOTIFICATIONS} pending (max ${maxCount})`, maxCount <= MAX_SCHEDULED_NOTIFICATIONS);
assert('full year: no two notifications at the same minute', sameMinuteViolations === 0);

console.log('All notification plan checks passed.');
