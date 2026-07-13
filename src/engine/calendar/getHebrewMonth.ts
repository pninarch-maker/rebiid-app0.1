import { HDate } from '@hebcal/core';

import { getRemindersForDay } from '../reminders/getRemindersForDay';
import type { EngineConfig, HebrewMonth, HebrewMonthDay, HebrewMonthWeek } from '../types';
import { toGregorianDateOnly } from '../zmanim/formatTime';
import {
  formatGregorianRange,
  formatHebrewMonthTitle,
  toHDate,
} from './formatters';
import { getHolidays } from './hebcalProvider';

const DAYS_IN_WEEK = 7;

function createEmptyDay(): HebrewMonthDay {
  return {
    date: null,
    hebrewDayNumber: null,
    gregorianDayNumber: null,
    isToday: false,
    isShabbat: false,
    isCurrentMonth: false,
    holidays: [],
    reminders: [],
  };
}

function buildMonthDay(
  hdate: HDate,
  config: EngineConfig,
  today: Date,
): HebrewMonthDay {
  const gregorianDate = toGregorianDateOnly(hdate.greg());
  const holidays = getHolidays(hdate, config);
  const reminders = getRemindersForDay(gregorianDate);

  return {
    date: gregorianDate,
    hebrewDayNumber: hdate.getDate(),
    gregorianDayNumber: gregorianDate.getDate(),
    isToday: gregorianDate.getTime() === today.getTime(),
    isShabbat: hdate.getDay() === 6,
    isCurrentMonth: true,
    holidays,
    reminders,
  };
}

export function getHebrewMonth(
  referenceDate: Date = new Date(),
  config: EngineConfig,
): HebrewMonth {
  const referenceHDate = toHDate(referenceDate);
  const month = referenceHDate.getMonth();
  const year = referenceHDate.getFullYear();
  const daysInMonth = HDate.daysInMonth(month, year);
  const firstOfMonth = new HDate(1, month, year);
  const lastOfMonth = new HDate(daysInMonth, month, year);
  const today = toGregorianDateOnly(new Date());

  const weeks: HebrewMonthWeek[] = [];
  let currentWeek: HebrewMonthDay[] = [];

  for (let index = 0; index < firstOfMonth.getDay(); index += 1) {
    currentWeek.push(createEmptyDay());
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const hdate = new HDate(day, month, year);
    currentWeek.push(buildMonthDay(hdate, config, today));

    if (currentWeek.length === DAYS_IN_WEEK) {
      weeks.push({ days: currentWeek });
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < DAYS_IN_WEEK) {
      currentWeek.push(createEmptyDay());
    }
    weeks.push({ days: currentWeek });
  }

  return {
    monthTitleHebrew: formatHebrewMonthTitle(month, year),
    gregorianRangeText: formatGregorianRange(firstOfMonth, lastOfMonth),
    weeks,
  };
}
