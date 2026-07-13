import { HDate, HebrewCalendar } from '@hebcal/core';

import {
  extractDayExpressionsFromRule,
  hebrewMonthLabelToEnglish,
  isErevRoshChodeshDay,
  isFriday,
  matchesHebrewMonthDay,
  parseDayExpression,
} from './hebrewDate';
import {
  isMinhagExactDateRecord,
  matchesMinhagExactDateRecord,
} from './minhagExactMatch';
import { isShabbatMinhagRecord, matchesShabbatMinhagRecord } from './shabbatMatch';

export type KnowledgeRecord = Record<string, string>;

export interface ExcelKnowledgeDatabase {
  sourceFile: string;
  sheets: Record<string, KnowledgeRecord[]>;
}

const RELATIVE_MINHAG_RULES: Record<string, { month: string; days: number[] }> = {
  'ראש השנה': { month: 'Tishrei', days: [1, 2] },
  'עשרת ימי תשובה': { month: 'Tishrei', days: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  'ערב יום הכיפורים': { month: 'Tishrei', days: [9] },
  'יום הכיפורים': { month: 'Tishrei', days: [10] },
  'מוצאי יום הכיפורים': { month: 'Tishrei', days: [10] },
  'שמחת תורה': { month: 'Tishrei', days: [22, 23] },
  'מוצאי שמחת תורה': { month: 'Tishrei', days: [22, 23] },
  'פורים': { month: 'Adar', days: [14] },
};

function getChanukahDay(hdate: HDate): number | null {
  const events = HebrewCalendar.calendar({
    start: hdate.greg(),
    end: hdate.greg(),
    il: true,
  });

  for (const event of events) {
    const desc = event.getDesc?.() ?? '';
    const match = desc.match(/Chanukah: (\d+) Candles?/i);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  return null;
}

function matchesRelativeMinhagRule(
  hdate: HDate,
  monthLabel: string,
  rule: string,
): boolean {
  const englishMonth = hebrewMonthLabelToEnglish(monthLabel);
  if (!englishMonth) {
    return false;
  }

  const relative = RELATIVE_MINHAG_RULES[rule.trim()];
  if (relative && relative.month === englishMonth) {
    return relative.days.includes(hdate.getDate());
  }

  if (rule.includes('ימי חנוכה')) {
    return getChanukahDay(hdate) !== null;
  }

  if (rule === 'ראש חודש') {
    return hdate.getDate() === 1;
  }

  if (rule === 'ערב ראש חודש' || rule === 'ליל ראש חודש') {
    return isErevRoshChodeshDay(hdate);
  }

  return false;
}

function matchesExplicitMinhagDate(
  hdate: HDate,
  monthLabel: string,
  rule: string,
): boolean {
  const englishMonth = hebrewMonthLabelToEnglish(monthLabel);
  if (!englishMonth) {
    return false;
  }

  const trimmedRule = rule.trim();
  const isErevNight = trimmedRule.startsWith('ליל ');
  const ruleWithoutPrefix = isErevNight ? trimmedRule.replace(/^ליל\s+/, '') : trimmedRule;

  const expressions = extractDayExpressionsFromRule(ruleWithoutPrefix);
  if (expressions.length === 0) {
    return false;
  }

  for (const expression of expressions) {
    const days = parseDayExpression(expression);
    for (const day of days) {
      if (isErevNight) {
        const target = new HDate(day, englishMonth, hdate.getFullYear());
        const eve = new HDate(target).add(-1);
        if (eve.abs() === hdate.abs()) {
          return true;
        }
        continue;
      }

      if (matchesHebrewMonthDay(hdate, monthLabel, day)) {
        return true;
      }
    }
  }

  return false;
}

function matchesYearRoundRule(hdate: HDate, rule: string): boolean {
  if (rule === 'ראש חודש') {
    return hdate.getDate() === 1;
  }
  if (rule === 'ערב ראש חודש' || rule === 'ליל ראש חודש') {
    return isErevRoshChodeshDay(hdate);
  }
  if (rule === 'מוצאי ראש חודש / תחילת החודש') {
    return hdate.getDate() <= 3;
  }
  return false;
}

function matchesNamedPeriodRule(hdate: HDate, monthLabel: string, rule: string): boolean {
  if (rule.includes('ימי חנוכה') || rule === 'לאחר הדלקת הנרות') {
    return getChanukahDay(hdate) !== null;
  }

  if (rule.includes('לילות חול המועד')) {
    return hdate.getMonthName() === 'Tishrei' && hdate.getDate() >= 17 && hdate.getDate() <= 20;
  }

  return false;
}

export function matchesYahrzeitRecord(record: KnowledgeRecord, hdate: HDate): boolean {
  const monthLabel = record['חודש']?.trim();
  const dayLabel = record['יום']?.trim();
  if (!monthLabel || !dayLabel) {
    return false;
  }

  const day = parseDayExpression(dayLabel)[0];
  if (day === undefined) {
    return false;
  }

  return matchesHebrewMonthDay(hdate, monthLabel, day);
}

export function matchesJewishHistoryRecord(record: KnowledgeRecord, hdate: HDate): boolean {
  const monthLabel = record['חודש']?.trim();
  const dayLabel = record['יום']?.trim();
  if (!monthLabel || !dayLabel) {
    return false;
  }

  const day = parseDayExpression(dayLabel)[0];
  if (day === undefined) {
    return false;
  }

  return matchesHebrewMonthDay(hdate, monthLabel, day);
}

export function matchesMinhagRecord(record: KnowledgeRecord, date: Date, hdate: HDate): boolean {
  if (isMinhagExactDateRecord(record)) {
    return matchesMinhagExactDateRecord(record, date, hdate);
  }

  const monthLabel = record['חודש']?.trim() ?? '';
  const rule = record['תאריך / כלל']?.trim() ?? '';

  if (isFriday(date) && isShabbatMinhagRecord(record)) {
    return matchesShabbatMinhagRecord(record, date);
  }

  if (monthLabel === 'כל השנה') {
    if (isShabbatMinhagRecord(record)) {
      return false;
    }
    return matchesYearRoundRule(hdate, rule);
  }

  if (matchesRelativeMinhagRule(hdate, monthLabel, rule)) {
    return true;
  }

  if (matchesExplicitMinhagDate(hdate, monthLabel, rule)) {
    return true;
  }

  return matchesNamedPeriodRule(hdate, monthLabel, rule);
}
