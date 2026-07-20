import { HDate } from '@hebcal/core';

import type { HebrewMonth, HebrewMonthDay } from '@/src/engine/types';

/**
 * Engine column order: index 0 = Sunday (א׳) … index 6 = Shabbat (ש׳).
 * Matches `HDate.getDay()` and `getHebrewMonth` week building.
 *
 * Visual layout: render with {@link mapEngineWeekToVisualOrder} inside
 * `physicalLtrRow` → physical left = ש׳, physical right = א׳.
 * Do not reorder `week.days` in the engine.
 */
export const CALENDAR_ENGINE_WEEKDAY_HEADERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'] as const;

/** Visual column index 0 = physical left (ש׳) … 6 = physical right (א׳). */
export const CALENDAR_VISUAL_COLUMN_ORDER = [6, 5, 4, 3, 2, 1, 0] as const;

/** @deprecated Use {@link CALENDAR_ENGINE_WEEKDAY_HEADERS} */
export const CALENDAR_WEEKDAY_HEADERS = CALENDAR_ENGINE_WEEKDAY_HEADERS;

/**
 * @deprecated Use {@link physicalLtrRow} + {@link mapEngineWeekToVisualOrder}.
 */
export const CALENDAR_GRID_ROW_DIRECTION = 'row' as const;

/** Visual column index (0 = left/shabbat … 6 = right/sunday) for an engine column. */
export function engineColumnToVisualPosition(engineColumnIndex: number): number {
  return 6 - engineColumnIndex;
}

/** Headers in physical left-to-right order: ש׳ … א׳. */
export function getVisualWeekdayHeadersLeftToRight(): readonly string[] {
  return CALENDAR_VISUAL_COLUMN_ORDER.map(
    (engineIndex) => CALENDAR_ENGINE_WEEKDAY_HEADERS[engineIndex],
  );
}

/**
 * Map a 7-column engine week to physical left-to-right visual order.
 * Use for weekday headers, date cells, empty cells, markers, and a11y DOM order.
 */
export function mapEngineWeekToVisualOrder<T>(engineWeek: readonly T[]): T[] {
  if (engineWeek.length !== 7) {
    throw new Error(`Calendar week must have 7 columns, got ${engineWeek.length}`);
  }

  return CALENDAR_VISUAL_COLUMN_ORDER.map((engineIndex) => engineWeek[engineIndex]);
}

/** Visual column (0 = left … 6 = right) where Hebrew day 1 appears, or -1 if absent. */
export function findHebrewDayOneVisualColumn(month: HebrewMonth): number {
  for (const week of month.weeks) {
    for (let visualColumn = 0; visualColumn < 7; visualColumn += 1) {
      const engineColumn = CALENDAR_VISUAL_COLUMN_ORDER[visualColumn];
      const day = week.days[engineColumn];

      if (day.isCurrentMonth && day.hebrewDayNumber === 1) {
        return visualColumn;
      }
    }
  }

  return -1;
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
    throw new Error(`Visual headers must be Sat→Sun left-to-right, got ${visual.join('|')}`);
  }

  const mapped = mapEngineWeekToVisualOrder([...CALENDAR_ENGINE_WEEKDAY_HEADERS]);
  if (mapped.join('|') !== visual.join('|')) {
    throw new Error('Visual column mapping does not match header order');
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
