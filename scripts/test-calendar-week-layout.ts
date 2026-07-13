/**
 * Calendar weekday column layout checks.
 * Run: npm run test:calendar
 */
import { getHebrewMonth } from '../src/engine/calendar/getHebrewMonth';
import { DEFAULT_ENGINE_CONFIG } from '../src/engine/types/JewishDay';
import { runCalendarWeekLayoutChecks } from '../lib/calendarWeekLayout';

function assert(label: string, fn: () => void): void {
  fn();
  console.log(`✓ ${label}`);
}

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

console.log('All calendar weekday layout checks passed.');
