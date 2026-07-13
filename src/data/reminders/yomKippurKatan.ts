import type { HDate } from '@hebcal/core';

/** Months whose erev Rosh Chodesh is omitted for Yom Kippur Katan (common minhag). */
const OMITTED_EREv_ROSH_CHODESH_MONTHS = new Set([
  'Cheshvan',
  'Kislev',
  'Tevet',
  'Shevat',
  'Adar',
  'Adar II',
]);

export function isErevRoshChodesh(hdate: HDate, tomorrow: HDate): boolean {
  return tomorrow.getDate() === 1 && tomorrow.getMonthName() !== hdate.getMonthName();
}

export function isErevRoshChodeshSivan(tomorrow: HDate): boolean {
  return tomorrow.getMonthName() === 'Sivan' && tomorrow.getDate() === 1;
}

export function isYomKippurKatanDay(hdate: HDate, tomorrow: HDate): boolean {
  if (!isErevRoshChodesh(hdate, tomorrow)) {
    return false;
  }

  return !OMITTED_EREv_ROSH_CHODESH_MONTHS.has(tomorrow.getMonthName());
}
