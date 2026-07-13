import { Location } from '@hebcal/core';

import { currentAppSettings } from '@/lib/appState';
import type { ZmanimCalculationProfile } from '@/src/engine/zmanim/types';

export function createZmanimLocation(): Location {
  const { latitude, longitude, timezone, city } = currentAppSettings;

  return new Location(latitude, longitude, true, timezone, city, 'IL');
}

export function getCandleLightingOffsetMinutes(): number {
  return currentAppSettings.candleLightingOffsetMinutes;
}

export function getHavdalahCalendarOptions(): {
  havdalahMins?: number;
} {
  if (currentAppSettings.havdalahMethod === 'rabbeinu_tam') {
    return { havdalahMins: 72 };
  }

  return {};
}

export function getZmanimCalculationProfile(): ZmanimCalculationProfile {
  return currentAppSettings.zmanimProfile ?? 'gra';
}
