/**
 * Calendar weekday column layout checks.
 * Run: npm run test:calendar
 */
import { HDate } from '@hebcal/core';

import {
  findHebrewDayOneVisualColumn,
  getVisualWeekdayHeadersLeftToRight,
  runCalendarWeekLayoutChecks,
} from '../lib/calendarWeekLayout';
import { getHebrewMonth } from '../src/engine/calendar/getHebrewMonth';
import { DEFAULT_ENGINE_CONFIG } from '../src/engine/types/JewishDay';

function assert(label: string, fn: () => void): void {
  fn();
  console.log(`✓ ${label}`);
}

function findGregorianMonthStart(weekday: number, year = 5786): Date {
  for (let month = 1; month <= 12; month += 1) {
    const hdate = new HDate(1, month, year);
    if (hdate.getDay() === weekday) {
      return hdate.greg();
    }
  }

  throw new Error(`No month in ${year} starts on weekday ${weekday}`);
}

assert('visual weekday headers run ש׳ (left) through א׳ (right)', () => {
  const headers = getVisualWeekdayHeadersLeftToRight();
  if (headers.join('|') !== 'ש|ו|ה|ד|ג|ב|א') {
    throw new Error(`Expected ש…א left-to-right, got ${headers.join('|')}`);
  }
});

assert('weekday constants and visual mapping', () => {
  runCalendarWeekLayoutChecks(
    getHebrewMonth(new Date(2026, 6, 1), DEFAULT_ENGINE_CONFIG),
  );
});

assert('Tammuz 5786 alignment', () => {
  runCalendarWeekLayoutChecks(
    getHebrewMonth(new Date(2026, 6, 15), DEFAULT_ENGINE_CONFIG),
  );
});

assert('Cheshvan 5786 alignment', () => {
  runCalendarWeekLayoutChecks(
    getHebrewMonth(new Date(2025, 10, 1), DEFAULT_ENGINE_CONFIG),
  );
});

assert('month starting on Sunday places day 1 in far-right column', () => {
  const month = getHebrewMonth(findGregorianMonthStart(0), DEFAULT_ENGINE_CONFIG);
  const column = findHebrewDayOneVisualColumn(month);
  if (column !== 6) {
    throw new Error(`Expected visual column 6 (far right), got ${column}`);
  }
});

assert('month starting on Shabbat places day 1 in far-left column', () => {
  const month = getHebrewMonth(findGregorianMonthStart(6), DEFAULT_ENGINE_CONFIG);
  const column = findHebrewDayOneVisualColumn(month);
  if (column !== 0) {
    throw new Error(`Expected visual column 0 (far left), got ${column}`);
  }
});

console.log('All calendar weekday layout checks passed.');
