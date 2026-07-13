import { HDate, getHolidaysOnDate, HebrewCalendar } from '@hebcal/core';

import {
  getShabbatDate,
  isFriday,
  isShabbatMevarchim,
  isShabbatRoshChodesh,
} from './hebrewDate';
import type { KnowledgeRecord } from './matchRecords';

function getShabbatParasha(shabbat: HDate, israel = true): string | null {
  const events = HebrewCalendar.calendar({
    start: shabbat.greg(),
    end: shabbat.greg(),
    il: israel,
    sedrot: true,
  });

  for (const event of events) {
    const desc = event.getDesc?.() ?? '';
    if (desc.startsWith('Parashat ')) {
      return desc.replace('Parashat ', '').trim();
    }
  }

  return null;
}

export function getShabbatHolidayDescriptions(shabbat: HDate, israel = true): string[] {
  const holidays = getHolidaysOnDate(shabbat, israel) ?? [];
  return holidays.flatMap((event) => {
    const desc = typeof event.getDesc === 'function' ? event.getDesc() : String(event.desc ?? '');
    const basename =
      typeof event.basename === 'function' ? event.basename() : String(event.basename ?? '');
    return [desc, basename].filter(Boolean);
  });
}

export function isShabbatMinhagRecord(record: KnowledgeRecord): boolean {
  const type = record['סוג']?.trim() ?? '';
  const rule = record['תאריך / כלל']?.trim() ?? '';
  const name = record['שם קצר']?.trim() ?? '';
  const exact = record['תאריך מדויק 1']?.trim() ?? '';
  return (
    type.includes('שבת') ||
    rule.includes('שבת') ||
    name.includes('שבת') ||
    exact.includes('שבת') ||
    exact.includes('פרשת')
  );
}

export function matchesShabbatMinhagRecord(record: KnowledgeRecord, friday: Date): boolean {
  if (!isFriday(friday)) {
    return false;
  }

  const rule = record['תאריך / כלל']?.trim() ?? '';
  if (rule.includes('מוצאי שבת')) {
    return false;
  }

  const shabbatDate = getShabbatDate(friday);
  const shabbat = new HDate(shabbatDate);
  const descriptions = getShabbatHolidayDescriptions(shabbat);
  const parasha = getShabbatParasha(shabbat);
  const name = record['שם קצר']?.trim() ?? '';

  if (name === 'שבת מברכים' || rule.includes('שבת שלפני ראש חודש')) {
    return isShabbatMevarchim(shabbat);
  }

  if (name === 'שבת ראש חודש' || rule === 'שבת ראש חודש') {
    return isShabbatRoshChodesh(shabbat);
  }

  if (name === 'מחר חודש' || rule === 'שבת ערב ראש חודש') {
    return new HDate(shabbat).add(1).getDate() === 1;
  }

  const namedMatches: Record<string, string[]> = {
    'שבת שובה': ['Shabbat Shuva', 'Shabbat Shuvah'],
    'שבת שקלים': ['Shabbat Shekalim'],
    'שבת זכור': ['Shabbat Zachor'],
    'שבת פרה': ['Shabbat Parah'],
    'שבת החודש': ['Shabbat HaChodesh', 'Shabbat Hachodesh'],
    'שבת הגדול': ['Shabbat HaGadol', 'Shabbat Hagadol'],
    'שבת חזון': ['Shabbat Chazon'],
    'שבת נחמו': ['Shabbat Nachamu'],
  };

  const expected = namedMatches[name];
  if (expected) {
    return expected.some((label) => descriptions.some((desc) => desc.includes(label)));
  }

  if (name === 'שבת שירה' || rule.includes('שבת פרשת בשלח') || rule.includes('שבת שירה')) {
    return parasha === 'Beshalach';
  }

  if (name === 'שובבי״ם' || rule.includes('משבת פרשת שמות')) {
    return parasha === 'Shemot' || parasha === 'Bo' || parasha === 'Beshalach';
  }

  if (rule.includes('שבת שלפני פורים') || name === 'שבת זכור') {
    return descriptions.some((desc) => desc.includes('Zachor'));
  }

  if (rule.includes('שבת שלפני ט׳ באב') || name === 'שבת חזון') {
    return descriptions.some((desc) => desc.includes('Chazon'));
  }

  if (rule.includes('שבת שלאחר ט׳ באב') || name === 'שבת נחמו') {
    return descriptions.some((desc) => desc.includes('Nachamu'));
  }

  if (rule.includes('שבת שלפני פסח') || name === 'שבת הגדול') {
    return descriptions.some((desc) => desc.includes('Gadol'));
  }

  if (rule.includes('שבת שלאחר פסח')) {
    return parasha === 'Achrei Mot' || parasha === 'Acharei Mot';
  }

  if (rule.includes('שבת שלפני ראש חודש ניסן') || name === 'שבת החודש') {
    return descriptions.some((desc) => desc.includes('HaChodesh') || desc.includes('Hachodesh'));
  }

  if (rule.includes('שבת שלפני או בראש חודש אדר') || name === 'שבת שקלים') {
    return descriptions.some((desc) => desc.includes('Shekalim'));
  }

  if (rule.includes('שבת שלאחר פורים') || name === 'שבת פרה') {
    return descriptions.some((desc) => desc.includes('Parah'));
  }

  if (rule.includes('שבת שבין ראש השנה ליום הכיפורים') || name === 'שבת שובה') {
    return descriptions.some((desc) => desc.includes('Shuva') || desc.includes('Shuvah'));
  }

  if (rule.includes('פורים החל סמוך לשבת')) {
    return shabbat.getMonthName() === 'Adar' && shabbat.getDate() >= 10 && shabbat.getDate() <= 16;
  }

  return false;
}
