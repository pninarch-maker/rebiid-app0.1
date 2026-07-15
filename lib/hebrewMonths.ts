import { gematriya } from '@hebcal/core';

/**
 * Shared English storage names ↔ Hebrew UI labels for custom reminders.
 * Storage stays English (`Nisan`, `Adar`, …); display is always Hebrew.
 */
export const ENGLISH_MONTH_TO_HEBREW_LABEL: Record<string, string> = {
  Tishrei: 'תשרי',
  Cheshvan: 'חשוון',
  Kislev: 'כסלו',
  Tevet: 'טבת',
  Shvat: 'שבט',
  Shevat: 'שבט',
  Adar: 'אדר',
  'Adar I': 'אדר א׳',
  'Adar II': 'אדר ב׳',
  Nisan: 'ניסן',
  Iyyar: 'אייר',
  Sivan: 'סיוון',
  Tammuz: 'תמוז',
  Tamuz: 'תמוז',
  Av: 'אב',
  Elul: 'אלול',
};

/** Normalize hebcal / legacy English month names to the storage form used in settings. */
export function toStoredHebrewMonthName(monthName: string): string {
  switch (monthName) {
    case 'Tamuz':
      return 'Tammuz';
    case 'Shevat':
      return 'Shvat';
    default:
      return monthName;
  }
}

export function englishMonthToHebrewLabel(monthName: string): string {
  const stored = toStoredHebrewMonthName(monthName);
  return ENGLISH_MONTH_TO_HEBREW_LABEL[stored] ?? ENGLISH_MONTH_TO_HEBREW_LABEL[monthName] ?? monthName;
}

/** Hebrew day numeral with geresh/gershayim (via @hebcal/core gematriya). */
export function formatHebrewDayNumeral(day: number): string {
  return gematriya(day);
}

/** e.g. כ״ט בתמוז · א׳ בניסן · ט״ו בשבט */
export function formatHebrewCustomDate(hebrewDay: number, hebrewMonth: string): string {
  const dayLabel = formatHebrewDayNumeral(hebrewDay);
  const monthLabel = englishMonthToHebrewLabel(hebrewMonth);
  return `${dayLabel} ב${monthLabel}`;
}

/** e.g. כ״ט בתמוז · 09:00 */
export function formatHebrewCustomDateWithTime(
  hebrewDay: number,
  hebrewMonth: string,
  time: string,
): string {
  return `${formatHebrewCustomDate(hebrewDay, hebrewMonth)} · ${time}`;
}
