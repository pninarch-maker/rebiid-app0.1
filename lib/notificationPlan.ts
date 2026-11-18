/**
 * Pure planning step for local notifications — no React Native / Expo imports,
 * so it can be regression-tested in Node (see scripts/test-notification-plan.ts).
 *
 * Responsibilities:
 * 1. Drop reminders with no trigger or a trigger in the past.
 * 2. Merge reminders that fire at the same minute (and on the same Android
 *    channel) into ONE notification, so the user never gets a burst of
 *    near-identical alerts (e.g. 5 Rosh Chodesh alerts at 08:00).
 * 3. Keep only the soonest MAX_SCHEDULED_NOTIFICATIONS, because iOS keeps at
 *    most 64 pending local notifications and silently drops the rest.
 */

/** iOS hard limit is 64 pending; keep headroom for the test notification. */
export const MAX_SCHEDULED_NOTIFICATIONS = 60;

export interface PlannableReminder {
  id: string;
  title: string;
  message: string;
  severity?: 'info' | 'important';
}

export interface PlannedNotification<R extends PlannableReminder> {
  /** Stable identifier — the primary reminder's id. */
  identifier: string;
  triggerDate: Date;
  /** Grouping key supplied by the caller (e.g. Android channel id). */
  groupKey: string;
  title: string;
  body: string;
  /** Reminder shown as the notification's headline. */
  primary: R;
  reminders: R[];
}

export interface PlanInput<R extends PlannableReminder> {
  reminder: R;
  triggerDate: Date | null | undefined;
  groupKey?: string;
}

function minuteKey(date: Date): number {
  return Math.floor(date.getTime() / 60000);
}

function severityRank(reminder: PlannableReminder): number {
  return reminder.severity === 'important' ? 0 : 1;
}

export function buildMergedText<R extends PlannableReminder>(
  reminders: R[],
): { title: string; body: string } {
  const [primary, ...rest] = reminders;

  if (rest.length === 0) {
    return { title: primary.title, body: primary.message };
  }

  const seenBodies = new Set<string>();
  const lines: string[] = [];
  for (const reminder of reminders) {
    const line = reminder.message.trim();
    if (line && !seenBodies.has(line)) {
      seenBodies.add(line);
      lines.push(line);
    }
  }

  return {
    title: `${primary.title} · ועוד ${rest.length}`,
    body: lines.join('\n'),
  };
}

export function planNotifications<R extends PlannableReminder>(
  inputs: PlanInput<R>[],
  now: number = Date.now(),
  max: number = MAX_SCHEDULED_NOTIFICATIONS,
): PlannedNotification<R>[] {
  const groups = new Map<string, { triggerDate: Date; groupKey: string; reminders: R[] }>();
  const seenIds = new Set<string>();

  for (const { reminder, triggerDate, groupKey = 'default' } of inputs) {
    if (!triggerDate || Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= now) {
      continue;
    }
    if (seenIds.has(reminder.id)) {
      continue;
    }
    seenIds.add(reminder.id);

    const key = `${minuteKey(triggerDate)}|${groupKey}`;
    const existing = groups.get(key);
    if (existing) {
      existing.reminders.push(reminder);
    } else {
      groups.set(key, { triggerDate, groupKey, reminders: [reminder] });
    }
  }

  return Array.from(groups.values())
    .map(({ triggerDate, groupKey, reminders }) => {
      // Stable sort: important first, otherwise keep catalog order.
      const ordered = reminders
        .map((reminder, index) => ({ reminder, index }))
        .sort((a, b) => severityRank(a.reminder) - severityRank(b.reminder) || a.index - b.index)
        .map(({ reminder }) => reminder);
      const { title, body } = buildMergedText(ordered);

      return {
        identifier: ordered[0].id,
        triggerDate,
        groupKey,
        title,
        body,
        primary: ordered[0],
        reminders: ordered,
      };
    })
    .sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime())
    .slice(0, Math.max(0, max));
}
