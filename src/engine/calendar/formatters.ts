import { gematriya, HDate, Locale } from '@hebcal/core';

const HEBREW_MONTHS: readonly string[] = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

const HEBREW_WEEKDAYS: readonly string[] = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת',
];

const HEBREW_LOCALE = 'he-x-NoNikud';

export function toHDate(date: Date = new Date()): HDate {
  return new HDate(date);
}

export function formatHebrewDate(hdate: HDate): string {
  const day = gematriya(hdate.getDate());
  const month = Locale.gettext(hdate.getMonthName(), HEBREW_LOCALE);
  const year = gematriya(hdate.getFullYear());

  return `${day} ב${month} ${year}`;
}

export function formatGregorianDate(hdate: HDate): string {
  const gregorian = hdate.greg();
  const month = HEBREW_MONTHS[gregorian.getMonth()];
  const day = gregorian.getDate();
  const year = gregorian.getFullYear();

  return `${day} ב${month} ${year}`;
}

export function formatDayOfWeek(hdate: HDate): string {
  return HEBREW_WEEKDAYS[hdate.getDay()];
}

export function formatHolidayName(description: string): string {
  return Locale.gettext(description, HEBREW_LOCALE);
}

export function formatParashaName(parsha: string[]): string {
  return parsha.map((name) => Locale.gettext(name, HEBREW_LOCALE)).join('-');
}

export function formatHebrewMonthTitle(month: number, year: number): string {
  const monthName = Locale.gettext(HDate.getMonthName(month, year), HEBREW_LOCALE);
  const yearLabel = gematriya(year);

  return `${monthName} ${yearLabel}`;
}

export function formatGregorianRange(start: HDate, end: HDate): string {
  const startGregorian = start.greg();
  const endGregorian = end.greg();
  const startMonth = HEBREW_MONTHS[startGregorian.getMonth()];
  const endMonth = HEBREW_MONTHS[endGregorian.getMonth()];

  if (
    startGregorian.getMonth() === endGregorian.getMonth() &&
    startGregorian.getFullYear() === endGregorian.getFullYear()
  ) {
    return `${startGregorian.getDate()}–${endGregorian.getDate()} ב${startMonth} ${startGregorian.getFullYear()}`;
  }

  return `${startGregorian.getDate()} ב${startMonth} ${startGregorian.getFullYear()} – ${endGregorian.getDate()} ב${endMonth} ${endGregorian.getFullYear()}`;
}
