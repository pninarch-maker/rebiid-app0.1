import { HebrewCalendar, OmerEvent } from '@hebcal/core';

import { toGregorianDateOnly } from '../zmanim/formatTime';

export function hasOmerEvent(date: Date, israel: boolean): boolean {
  const day = toGregorianDateOnly(date);
  const events = HebrewCalendar.calendar({
    start: day,
    end: day,
    omer: true,
    il: israel,
  });

  return events.some((event) => event instanceof OmerEvent);
}

export function holidaysIncludeRoshChodesh(holidays: string[]): boolean {
  return holidays.some((holiday) => holiday.includes('ראש חודש'));
}

export function holidaysIncludeOmer(holidays: string[]): boolean {
  return holidays.some(
    (holiday) => holiday.includes('ספירת העומר') || holiday.includes('בעומר'),
  );
}

export function isFriday(dayOfWeek: string, date: Date): boolean {
  return dayOfWeek === 'יום שישי' || date.getDay() === 5;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
