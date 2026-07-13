import { HDate } from '@hebcal/core';
import {
  CandleLightingEvent,
  HavdalahEvent,
  HebrewCalendar,
  Zmanim,
} from '@hebcal/core';
import type { Location } from '@hebcal/core';

import { currentAppSettings } from '@/lib/appState';

import { calculateHalachicZmanim } from './calculate';
import {
  createZmanimLocation,
  getCandleLightingOffsetMinutes,
  getHavdalahCalendarOptions,
  getZmanimCalculationProfile,
} from './location';
import { formatZmanTime, toGregorianDateOnly } from './formatTime';
import type { JewishDayZmanim } from './types';

export type { JewishDayZmanim, ZmanimCalculationProfile } from './types';
export { DEFAULT_ZMANIM_PROFILE } from './types';

interface TimedZmanEvents {
  candleLighting?: string;
  havdalah?: string;
}

function getTimedZmanEvents(date: Date, location: Location): TimedZmanEvents {
  const day = toGregorianDateOnly(date);
  const events = HebrewCalendar.calendar({
    start: day,
    end: day,
    candlelighting: true,
    location,
    il: true,
    candleLightingMins: getCandleLightingOffsetMinutes(),
    ...getHavdalahCalendarOptions(),
  });

  const candleEvent = events.find(
    (event): event is CandleLightingEvent => event instanceof CandleLightingEvent,
  );
  const havdalahEvent = events.find(
    (event): event is HavdalahEvent => event instanceof HavdalahEvent,
  );

  return {
    candleLighting: candleEvent?.eventTimeStr,
    havdalah: havdalahEvent?.eventTimeStr,
  };
}

/**
 * Calculate halachic zmanim for a date using the user's selected city from Settings.
 * All times come from @hebcal/core Zmanim methods (NOAA solar + halachic hour math).
 */
export function getZmanim(date: Date = new Date()): JewishDayZmanim {
  const location = createZmanimLocation();
  const day = toGregorianDateOnly(date);
  const zmanim = new Zmanim(location, day, false);
  const timedEvents = getTimedZmanEvents(day, location);
  const weekday = new HDate(day).getDay();

  return calculateHalachicZmanim(
    zmanim,
    location,
    getZmanimCalculationProfile(),
    timedEvents,
    currentAppSettings.havdalahMethod,
    weekday,
  );
}

export { formatZmanTime, toGregorianDateOnly } from './formatTime';
