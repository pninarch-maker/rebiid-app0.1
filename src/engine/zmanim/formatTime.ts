import { Zmanim } from '@hebcal/core';
import type { Location } from '@hebcal/core';

import { INVALID_ZMAN_TIME } from './config';

export function isValidZmanDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function formatZmanTime(date: Date, location: Location): string | undefined {
  if (!isValidZmanDate(date)) {
    return undefined;
  }

  const formatted = Zmanim.formatTime(date, location.getTimeFormatter());

  if (formatted === INVALID_ZMAN_TIME) {
    return undefined;
  }

  return formatted;
}

export function toGregorianDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
