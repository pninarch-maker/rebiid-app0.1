import { HDate } from '@hebcal/core';

/** Morning of Taanit Bechorot: 14 Nisan, or 12 Nisan when Erev Pesach is Shabbat. */
export function getTaanitBechorotHDate(hebrewYear: number): HDate {
  const nisan14 = new HDate(14, 'Nisan', hebrewYear);
  if (nisan14.getDay() === 6) {
    return new HDate(12, 'Nisan', hebrewYear);
  }
  return nisan14;
}

export function isTaanitBechorotDay(hdate: HDate): boolean {
  const observed = getTaanitBechorotHDate(hdate.getFullYear());
  return hdate.abs() === observed.abs();
}

export function isTaanitBechorotEve(hdate: HDate): boolean {
  const observed = getTaanitBechorotHDate(hdate.getFullYear());
  return hdate.abs() === observed.add(-1).abs();
}
