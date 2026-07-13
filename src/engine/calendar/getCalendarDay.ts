import type { EngineConfig } from '../types';
import {
  formatDayOfWeek,
  formatGregorianDate,
  formatHebrewDate,
  toHDate,
} from './formatters';
import { getHolidays, getParasha } from './hebcalProvider';

export interface CalendarDayData {
  hebrewDate: string;
  gregorianDate: string;
  dayOfWeek: string;
  parasha?: string;
  holidays: string[];
}

export function getCalendarDay(
  config: EngineConfig,
  date: Date = new Date(),
): CalendarDayData {
  const hdate = toHDate(date);

  return {
    hebrewDate: formatHebrewDate(hdate),
    gregorianDate: formatGregorianDate(hdate),
    dayOfWeek: formatDayOfWeek(hdate),
    parasha: getParasha(hdate, config),
    holidays: getHolidays(hdate, config),
  };
}
