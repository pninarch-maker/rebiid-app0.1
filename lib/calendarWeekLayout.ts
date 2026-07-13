import { HDate } from '@hebcal/core';

import type { HebrewMonth, HebrewMonthDay } from '@/src/engine/types';

/**
 * Engine column order: index 0 = Sunday (א׳) … index 6 = Shabbat (ש׳).
 * Matches `HDate.getDay()` and `getHebrewMonth` week building.
 *
 * Visual layout: engine-order children with
 * `hebrewStartFlexDirection()` from `@/constants/layout`
 * → א׳ far right, ש׳ far left. Do not reorder `week.days`.
 */
export const CALENDAR_ENGINE_WEEKDAY_HEADERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'] as const;

/** @deprecated Use {@link CALENDAR_ENGINE_WEEKDAY_HEADERS} */
export const CALENDAR_WEEKDAY_HEADERS = CALENDAR_ENGINE_WEEKDAY_HEADERS;

/**
 * @deprecated Prefer `hebrewStartFlexDirection()` from `@/constants/layout`
 * at style-build time. Kept for older call sites.
 */
export const CALENDAR_GRID_ROW_DIRECTION = 'row' as const;

/** Visual column index (0 = left/shabbat … 6 = right/sunday) for an engine column. */
export function engineColumnToVisualPosition(engineColumnIndex: number): number {
  return 6 - engineColumnIndex;
}

export function getVisualWeekdayHeadersLeftToRight(): string[] {
  return [...CALENDAR_ENGINE_WEEKDAY_HEADERS].reverse();
}

export function assertWeekHasSevenColumns(weekDays: HebrewMonthDay[]): void {
  if (weekDays.length !== 7) {
    throw new Error(`Calendar week must have 7 columns, got ${weekDays.length}`);
  }
}

export function validateCalendarWeekLayoutConstants(): void {
  const headers = CALENDAR_ENGINE_WEEKDAY_HEADERS;

  if (headers[0] !== 'א' || headers[6] !== 'ש') {
    throw new Error(`Engine headers must be Sun→Sat, got ${headers.join('|')}`);
  }

  const visual = getVisualWeekdayHeadersLeftToRight();
  if (visual[0] !== 'ש' || visual[6] !== 'א') {
    throw new Error(`Visual headers must be Sat→Sun, got ${visual.join('|')}`);
  }

  if (engineColumnToVisualPosition(0) !== 6 || engineColumnToVisualPosition(6) !== 0) {
    throw new Error('Engine column to visual position mapping is incorrect');
  }
}

/** Every dated cell must sit under the weekday matching `HDate.getDay()`. */
export function validateMonthWeekAlignment(month: HebrewMonth): void {
  for (const [weekIndex, week] of month.weeks.entries()) {
    assertWeekHasSevenColumns(week.days);

    for (let engineColumnIndex = 0; engineColumnIndex < 7; engineColumnIndex += 1) {
      const day = week.days[engineColumnIndex];

      if (!day.date || !day.isCurrentMonth) {
        continue;
      }

      const weekday = new HDate(day.date).getDay();

      if (weekday !== engineColumnIndex) {
        throw new Error(
          `Week ${weekIndex} column ${engineColumnIndex}: ` +
            `${day.date.toISOString()} is weekday ${weekday}, expected ${engineColumnIndex}`,
        );
      }
    }
  }
}

export function runCalendarWeekLayoutChecks(month: HebrewMonth): void {
  validateCalendarWeekLayoutConstants();
  validateMonthWeekAlignment(month);
}
