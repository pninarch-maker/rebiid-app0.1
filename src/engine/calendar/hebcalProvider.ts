import { getHolidaysOnDate, getSedra, HDate } from '@hebcal/core';

import type { EngineConfig } from '../types';
import { formatHolidayName, formatParashaName } from './formatters';

export function getHolidays(hdate: HDate, config: EngineConfig): string[] {
  const events = getHolidaysOnDate(hdate, config.israel);

  if (!events?.length) {
    return [];
  }

  return events.map((event) => formatHolidayName(event.getDesc()));
}

export function getParasha(hdate: HDate, config: EngineConfig): string | undefined {
  const sedra = getSedra(hdate.getFullYear(), config.israel);
  const result = sedra.lookup(hdate);

  if (result.chag || result.parsha.length === 0) {
    return undefined;
  }

  return formatParashaName(result.parsha);
}
