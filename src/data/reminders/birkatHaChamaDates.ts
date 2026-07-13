import { addDays, toDateKey } from '@/src/engine/reminders/helpers';

export interface BirkatHaChamaOccurrence {
  gregorianDate: string;
  hebrewDate: string;
}

/** Static table of upcoming Birkat HaChama dates (28-year cycle). Extend as needed. */
export const BIRKAT_HACHAMA_DATES: BirkatHaChamaOccurrence[] = [
  {
    gregorianDate: '2037-04-08',
    hebrewDate: 'כ״ג בניסן ה׳תשצ״ז',
  },
  {
    gregorianDate: '2065-04-08',
    hebrewDate: 'ב׳ בניסן ה׳תתכ״ה',
  },
  {
    gregorianDate: '2093-04-08',
    hebrewDate: 'י״ב בניסן ה׳תתי״ג',
  },
];

const BIRKAT_HACHAMA_DATE_KEYS = new Set(
  BIRKAT_HACHAMA_DATES.map((entry) => entry.gregorianDate),
);

export function isBirkatHaChamaGregorianDate(date: Date): boolean {
  return BIRKAT_HACHAMA_DATE_KEYS.has(toDateKey(date));
}

export function isBirkatHaChamaEve(date: Date): boolean {
  return isBirkatHaChamaGregorianDate(addDays(date, 1));
}
