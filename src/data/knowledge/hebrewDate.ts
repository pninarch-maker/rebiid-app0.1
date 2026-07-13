import { HDate } from '@hebcal/core';

import { isErevRoshChodesh } from '@/src/data/reminders/yomKippurKatan';

/** Hebrew month labels from the Excel databases -> @hebcal/core month names. */
export const HEBREW_MONTH_LABEL_TO_ENGLISH: Record<string, string> = {
  תשרי: 'Tishrei',
  חשוון: 'Cheshvan',
  חשון: 'Cheshvan',
  מרחשוון: 'Cheshvan',
  כסלו: 'Kislev',
  טבת: 'Tevet',
  שבט: 'Shevat',
  /** Plain Adar: non-leap Adar, or Adar II in a leap year (standard yahrzeit convention). */
  אדר: 'Adar',
  'אדר א׳': 'Adar I',
  'אדר א': 'Adar I',
  "אדר א'": 'Adar I',
  'אדר ב׳': 'Adar II',
  'אדר ב': 'Adar II',
  "אדר ב'": 'Adar II',
  'אדר II': 'Adar II',
  ניסן: 'Nisan',
  אייר: 'Iyyar',
  סיוון: 'Sivan',
  תמוז: 'Tammuz',
  אב: 'Av',
  אלול: 'Elul',
};

const GEMATRIA_VALUES: Record<string, number> = {
  א: 1,
  ב: 2,
  ג: 3,
  ד: 4,
  ה: 5,
  ו: 6,
  ז: 7,
  ח: 8,
  ט: 9,
  י: 10,
  כ: 20,
  ך: 20,
  ל: 30,
};

export function parseHebrewNumeral(value: string): number | null {
  const cleaned = value
    .trim()
    .replace(/["']/g, '')
    .replace(/״/g, '')
    .replace(/׳/g, '')
    .replace(/\s+/g, '');

  if (!cleaned) {
    return null;
  }

  let total = 0;
  for (const char of cleaned) {
    const amount = GEMATRIA_VALUES[char];
    if (amount === undefined) {
      return null;
    }
    total += amount;
  }

  return total >= 1 && total <= 30 ? total : null;
}

export function hebrewMonthLabelToEnglish(label: string): string | null {
  const trimmed = label.trim();
  return HEBREW_MONTH_LABEL_TO_ENGLISH[trimmed] ?? null;
}

export function normalizeEnglishMonthName(month: string): string {
  switch (month) {
    case 'Tamuz':
    case 'Tammuz':
      return 'Tamuz';
    case 'Shvat':
    case 'Shevat':
      return 'Shvat';
    case 'Adar I':
      return 'Adar I';
    case 'Adar II':
      return 'Adar II';
    case 'Adar':
      return 'Adar';
    default:
      return month;
  }
}

export function hdateMatchesEnglishMonth(hdate: HDate, englishMonth: string): boolean {
  const actual = normalizeEnglishMonthName(String(hdate.getMonthName()));
  const expected = normalizeEnglishMonthName(englishMonth);

  if (actual === expected) {
    return true;
  }

  // Plain "אדר" / Adar: match non-leap Adar or leap-year Adar II.
  if (expected === 'Adar') {
    return actual === 'Adar' || actual === 'Adar II';
  }

  return false;
}

export function matchesHebrewMonthDay(hdate: HDate, monthLabel: string, day: number): boolean {
  const englishMonth = hebrewMonthLabelToEnglish(monthLabel);
  if (!englishMonth) {
    return false;
  }

  return hdateMatchesEnglishMonth(hdate, englishMonth) && hdate.getDate() === day;
}

export function parseDayToken(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(numeric)) {
    return numeric >= 1 && numeric <= 30 ? numeric : null;
  }

  return parseHebrewNumeral(trimmed);
}

export function parseDayExpression(expression: string): number[] {
  const cleaned = expression.trim();
  if (!cleaned) {
    return [];
  }

  const rangeParts = cleaned.split(/[–-]/);
  if (rangeParts.length === 2) {
    const start = parseDayToken(rangeParts[0]);
    const end = parseDayToken(rangeParts[1]);
    if (start !== null && end !== null && start <= end) {
      return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }
  }

  const single = parseDayToken(cleaned);
  return single === null ? [] : [single];
}

export function extractDayExpressionsFromRule(rule: string): string[] {
  const expressions: string[] = [];
  const dayPattern = /([א-ת״׳'0-9]+(?:[–-][א-ת״׳'0-9]+)?)/g;

  for (const match of rule.matchAll(dayPattern)) {
    const token = match[1];
    if (parseDayToken(token.split(/[–-]/)[0]) !== null) {
      expressions.push(token);
    }
  }

  return expressions;
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

export function getShabbatDate(friday: Date): Date {
  const shabbat = new Date(friday);
  shabbat.setDate(shabbat.getDate() + 1);
  shabbat.setHours(12, 0, 0, 0);
  return shabbat;
}

export function isShabbatMevarchim(shabbat: HDate): boolean {
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = new HDate(shabbat).add(offset);
    if (candidate.getDate() === 1 && candidate.getMonthName() !== 'Tishrei') {
      return true;
    }
  }
  return false;
}

export function isShabbatRoshChodesh(shabbat: HDate): boolean {
  if (shabbat.getDate() === 1) {
    return true;
  }
  const sunday = new HDate(shabbat).add(1);
  return sunday.getDate() === 1;
}

export function isErevRoshChodeshDay(hdate: HDate): boolean {
  const tomorrow = new HDate(hdate).add(1);
  return isErevRoshChodesh(hdate, tomorrow);
}

export function isMotzeiShabbat(date: Date): boolean {
  return date.getDay() === 6;
}
