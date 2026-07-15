import {
  ChanukahEvent,
  getHolidaysOnDate,
  HDate,
  HebrewCalendar,
  HolidayEvent,
  OmerEvent,
  RoshChodeshEvent,
} from '@hebcal/core';

import { getCalendarDay } from '../calendar/getCalendarDay';
import { DEFAULT_ENGINE_CONFIG, type JewishDayZmanim } from '../types';
import { getZmanim } from '../zmanim';
import { toGregorianDateOnly } from '../zmanim/formatTime';
import { addDays } from './helpers';

export interface DayEventInfo {
  desc: string;
  basename: string;
  observed?: boolean;
  isRoshChodesh: boolean;
  isChanukah: boolean;
  isOmer: boolean;
  omerDay?: number;
  chanukahDay?: number;
}

export interface DayCalendarContext {
  date: Date;
  hdate: HDate;
  tomorrow: HDate;
  hebrewDate: string;
  gregorianDate: string;
  dayOfWeek: string;
  weekday: number;
  isFriday: boolean;
  isSaturday: boolean;
  zmanim: JewishDayZmanim;
  events: DayEventInfo[];
  tomorrowEvents: DayEventInfo[];
  israel: boolean;
}

function mapEvent(event: unknown): DayEventInfo | null {
  if (!(event instanceof HolidayEvent)) {
    if (event instanceof OmerEvent) {
      return {
        desc: event.getDesc(),
        basename: 'Omer',
        isRoshChodesh: false,
        isChanukah: false,
        isOmer: true,
        omerDay: event.omer,
      };
    }
    return null;
  }

  return {
    desc: event.getDesc(),
    basename: event.basename(),
    observed: 'observed' in event ? Boolean((event as HolidayEvent).observed) : undefined,
    isRoshChodesh: event instanceof RoshChodeshEvent,
    isChanukah: event instanceof ChanukahEvent,
    isOmer: false,
    chanukahDay: event instanceof ChanukahEvent ? event.chanukahDay : undefined,
  };
}

function getEventsForHDate(hdate: HDate, israel: boolean): DayEventInfo[] {
  const greg = toGregorianDateOnly(hdate.greg());
  const calendarEvents = HebrewCalendar.calendar({
    start: greg,
    end: greg,
    il: israel,
    omer: true,
    candlelighting: false,
  });

  const holidayEvents = getHolidaysOnDate(hdate, israel) ?? [];
  const combined = [...calendarEvents, ...holidayEvents];
  const mapped = combined.map(mapEvent).filter((event): event is DayEventInfo => event !== null);

  const unique = new Map<string, DayEventInfo>();
  for (const event of mapped) {
    unique.set(`${event.desc}-${event.basename}`, event);
  }

  return Array.from(unique.values());
}

export function buildDayCalendarContext(date: Date, israel: boolean): DayCalendarContext {
  const day = toGregorianDateOnly(date);
  const calendar = getCalendarDay(DEFAULT_ENGINE_CONFIG, day);
  const hdate = new HDate(day);
  const tomorrow = addDays(day, 1);
  const tomorrowHdate = new HDate(tomorrow);

  return {
    date: day,
    hdate,
    tomorrow: tomorrowHdate,
    hebrewDate: calendar.hebrewDate,
    gregorianDate: calendar.gregorianDate,
    dayOfWeek: calendar.dayOfWeek,
    weekday: hdate.getDay(),
    isFriday: hdate.getDay() === 5,
    isSaturday: hdate.getDay() === 6,
    zmanim: getZmanim(day),
    events: getEventsForHDate(hdate, israel),
    tomorrowEvents: getEventsForHDate(tomorrowHdate, israel),
    israel,
  };
}

export function daysUntilHebrewDate(from: HDate, monthName: string, day: number): number {
  const targetYear = from.getFullYear();
  let target = new HDate(day, monthName, targetYear);

  if (target.abs() < from.abs()) {
    target = new HDate(day, monthName, targetYear + 1);
  }

  return target.abs() - from.abs();
}

/**
 * Keywords that must equal event `desc` exactly.
 * Substring matching incorrectly matched "Yom Kippur Katan Av" / "Purim Katan".
 * Basename-only matching is unsafe: hebcal sets basename "Yom Kippur" on
 * "Erev Yom Kippur" (and similarly for Purim), which would fire day-of rules on erev.
 */
const EXACT_HOLIDAY_DESC_KEYWORDS = new Set([
  'Yom Kippur',
  'Erev Yom Kippur',
  'Purim',
  'Erev Purim',
]);

function eventMatchesHolidayKeyword(event: DayEventInfo, keyword: string): boolean {
  if (EXACT_HOLIDAY_DESC_KEYWORDS.has(keyword)) {
    return event.desc === keyword;
  }

  const lowerKeyword = keyword.toLowerCase();
  return (
    event.desc.includes(keyword) ||
    event.basename.includes(keyword) ||
    event.desc.toLowerCase().includes(lowerKeyword)
  );
}

export function hasHolidayKeyword(events: DayEventInfo[], keywords: string[]): boolean {
  return events.some((event) =>
    keywords.some((keyword) => eventMatchesHolidayKeyword(event, keyword)),
  );
}

export function hasHolidayKeywordOnDate(
  date: Date,
  israel: boolean,
  keywords: string[],
): boolean {
  const hdate = new HDate(date);
  return hasHolidayKeyword(getEventsForHDate(hdate, israel), keywords);
}

export function isRoshChodeshDay(events: DayEventInfo[]): boolean {
  return events.some((event) => event.isRoshChodesh);
}

export function isOmerDay(events: DayEventInfo[]): boolean {
  return events.some((event) => event.isOmer);
}

export function isChanukahDay(events: DayEventInfo[]): boolean {
  return events.some((event) => event.isChanukah);
}
