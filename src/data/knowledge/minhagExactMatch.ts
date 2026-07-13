import { HDate } from '@hebcal/core';

import {
  hebrewMonthLabelToEnglish,
  hdateMatchesEnglishMonth,
  isFriday,
  matchesHebrewMonthDay,
  normalizeEnglishMonthName,
  parseDayExpression,
  parseHebrewNumeral,
} from './hebrewDate';
import type { KnowledgeRecord } from './matchRecords';
import { isShabbatMinhagRecord, matchesShabbatMinhagRecord } from './shabbatMatch';

const HEBREW_MONTHS_IN_TEXT = [
  'מרחשוון',
  'חשוון',
  'חשון',
  'אדר א׳',
  'אדר א',
  'אדר ב׳',
  'אדר ב',
  'תשרי',
  'כסלו',
  'טבת',
  'שבט',
  'אדר',
  'ניסן',
  'אייר',
  'סיוון',
  'תמוז',
  'אב',
  'אלול',
] as const;

type ParsedExactPoint =
  | { kind: 'monthDay'; monthLabel: string; day: number }
  | { kind: 'monthDayRelative'; day: number; relativeMonth: 'current' | 'previous' | 'next' }
  | { kind: 'shabbatExpression'; expression: string }
  | { kind: 'anyDayInMonth'; monthLabel: string }
  | { kind: 'chanukahAfterDay8' }
  | { kind: 'lagBaomerShavuot' };

function normalizeExpression(expression: string): string {
  return expression.trim().replace(/\s+/g, ' ');
}

function stripTimingPrefix(expression: string): { timing: string; body: string } {
  const trimmed = normalizeExpression(expression);
  const match = trimmed.match(/^(ליל|ערב|מוצאי|בוקר|מוסף)\s+(.+)$/u);
  if (match) {
    return { timing: match[1], body: match[2].replace(/\s+לפני השקיעה$/u, '').trim() };
  }
  return { timing: '', body: trimmed.replace(/\s+לפני השקיעה$/u, '').trim() };
}

function extractMonthLabel(text: string): string | null {
  for (const month of HEBREW_MONTHS_IN_TEXT) {
    if (text.endsWith(` ${month}`) || text === month) {
      return month;
    }
    if (text.endsWith(month)) {
      const prefix = text.slice(0, text.length - month.length).trim();
      if (prefix.length > 0) {
        return month;
      }
    }
  }
  return null;
}

function parseMonthDayBody(body: string, recordMonth: string): ParsedExactPoint | null {
  if (body === 'במהלך החודש') {
    if (recordMonth && recordMonth !== 'כל השנה') {
      return { kind: 'anyDayInMonth', monthLabel: recordMonth };
    }
    return null;
  }

  if (body === 'לאחר היום השמיני של חנוכה') {
    return { kind: 'chanukahAfterDay8' };
  }

  if (body === 'ל״ג בעומר / שבועות') {
    return { kind: 'lagBaomerShavuot' };
  }

  if (body.includes('שבת') || body.includes('פרשת') || body.includes('פרשה')) {
    return { kind: 'shabbatExpression', expression: body };
  }

  if (body.includes('ליל ויום')) {
    const inner = body.replace(/^ליל ויום\s+/u, '').trim();
    const monthLabel = extractMonthLabel(inner);
    const dayPart = monthLabel ? inner.slice(0, inner.length - monthLabel.length).trim() : inner;
    const day = parseDayExpression(dayPart)[0];
    if (day !== undefined && monthLabel) {
      return { kind: 'monthDay', monthLabel, day };
    }
  }

  if (body.endsWith('בחודש הקודם')) {
    const dayPart = body.replace(/\s*בחודש הקודם$/u, '').trim();
    const day = parseDayExpression(dayPart)[0];
    return day === undefined ? null : { kind: 'monthDayRelative', day, relativeMonth: 'previous' };
  }

  if (body.endsWith('בחודש הבא')) {
    const dayPart = body.replace(/\s*בחודש הבא$/u, '').trim();
    const day = parseDayExpression(dayPart)[0];
    return day === undefined ? null : { kind: 'monthDayRelative', day, relativeMonth: 'next' };
  }

  if (body.endsWith('בחודש')) {
    const dayPart = body.replace(/\s*בחודש$/u, '').trim();
    const day = parseDayExpression(dayPart)[0];
    return day === undefined ? null : { kind: 'monthDayRelative', day, relativeMonth: 'current' };
  }

  const monthLabel = extractMonthLabel(body);
  if (monthLabel) {
    const dayPart = body.slice(0, body.length - monthLabel.length).trim();
    const day = parseDayExpression(dayPart)[0];
    if (day !== undefined) {
      return { kind: 'monthDay', monthLabel, day };
    }
  }

  if (recordMonth && recordMonth !== 'כל השנה') {
    const day = parseDayExpression(body)[0];
    if (day !== undefined) {
      return { kind: 'monthDay', monthLabel: recordMonth, day };
    }
  }

  return null;
}

function parseExactPoint(expression: string, recordMonth: string): ParsedExactPoint | null {
  const { body } = stripTimingPrefix(expression);
  if (!body) {
    return null;
  }

  if (body.startsWith('עד ')) {
    return parseMonthDayBody(body.replace(/^עד\s+/u, ''), recordMonth);
  }

  if (body.includes('–') || (body.includes('-') && !body.includes('לפני'))) {
    return null;
  }

  return parseMonthDayBody(body, recordMonth);
}

function parseExactRange(
  startExpression: string,
  endExpression: string,
  recordMonth: string,
): ParsedExactPoint[] {
  const start = parseExactPoint(startExpression, recordMonth);
  const end = parseExactPoint(endExpression, recordMonth);
  if (!start || !end) {
    return start ? [start] : [];
  }

  if (start.kind === 'monthDay' && end.kind === 'monthDay' && start.monthLabel === end.monthLabel) {
    const englishMonth = hebrewMonthLabelToEnglish(start.monthLabel);
    if (!englishMonth) {
      return [start];
    }

    const points: ParsedExactPoint[] = [];
    for (let day = start.day; day <= end.day; day += 1) {
      points.push({ kind: 'monthDay', monthLabel: start.monthLabel, day });
    }
    return points;
  }

  return [start, end];
}

function isErevDisplayRule(rule: string, timing: string): boolean {
  const trimmedRule = rule.trim();
  return trimmedRule.startsWith('ערב') || trimmedRule.startsWith('ליל ') || timing === 'ליל' || timing === 'ערב';
}

function hdateAbs(hdate: HDate): number {
  return hdate.abs();
}

function matchesRoshChodeshSpan(hdate: HDate): boolean {
  if (hdate.getDate() === 1) {
    return true;
  }
  return new HDate(hdate).add(1).getDate() === 1;
}

function hdateFromEnglishMonthDay(day: number, englishMonth: string, year: number): HDate {
  return new HDate(day, normalizeEnglishMonthName(englishMonth), year);
}

function pointToTargetHDate(point: ParsedExactPoint, contextHDate: HDate): HDate[] {
  switch (point.kind) {
    case 'monthDay': {
      const englishMonth = hebrewMonthLabelToEnglish(point.monthLabel);
      if (!englishMonth) {
        return [];
      }
      return [hdateFromEnglishMonthDay(point.day, englishMonth, contextHDate.getFullYear())];
    }
    case 'monthDayRelative': {
      if (point.relativeMonth === 'current') {
        return [
          hdateFromEnglishMonthDay(
            point.day,
            contextHDate.getMonthName(),
            contextHDate.getFullYear(),
          ),
        ];
      }
      if (point.relativeMonth === 'previous') {
        const monthStart = hdateFromEnglishMonthDay(
          1,
          contextHDate.getMonthName(),
          contextHDate.getFullYear(),
        );
        const previousMonthLast = new HDate(monthStart).add(-1);
        return [
          hdateFromEnglishMonthDay(
            point.day,
            previousMonthLast.getMonthName(),
            previousMonthLast.getFullYear(),
          ),
        ];
      }
      const monthStart = hdateFromEnglishMonthDay(
        1,
        contextHDate.getMonthName(),
        contextHDate.getFullYear(),
      );
      const monthEnd = new HDate(monthStart).add(30);
      return [
        hdateFromEnglishMonthDay(point.day, monthEnd.getMonthName(), monthEnd.getFullYear()),
      ];
    }
    case 'anyDayInMonth': {
      const englishMonth = hebrewMonthLabelToEnglish(point.monthLabel);
      if (!englishMonth || !hdateMatchesEnglishMonth(contextHDate, englishMonth)) {
        return [];
      }
      return [contextHDate];
    }
    case 'chanukahAfterDay8':
    case 'lagBaomerShavuot':
    case 'shabbatExpression':
      return [];
    default:
      return [];
  }
}

function targetMatchesDisplayDate(
  target: HDate,
  hdate: HDate,
  rule: string,
  timing: string,
): boolean {
  if (isErevDisplayRule(rule, timing)) {
    return hdateAbs(new HDate(hdate).add(1)) === hdateAbs(target);
  }
  return hdateAbs(hdate) === hdateAbs(target);
}

function expressionMatchesDate(
  expression: string,
  hdate: HDate,
  recordMonth: string,
  rule: string,
  record: KnowledgeRecord,
): boolean {
  const { timing, body } = stripTimingPrefix(expression);
  if (!body) {
    return false;
  }

  if (body.startsWith('עד ')) {
    return false;
  }

  const point = parseExactPoint(expression, recordMonth);
  if (!point) {
    return false;
  }

  if (point.kind === 'shabbatExpression') {
    const friday = new Date(hdate.greg());
    if (friday.getDay() === 6) {
      friday.setDate(friday.getDate() - 1);
    } else if (friday.getDay() !== 5) {
      return false;
    }
    friday.setHours(12, 0, 0, 0);
    return matchesShabbatMinhagRecord(record, friday);
  }

  if (point.kind === 'chanukahAfterDay8') {
    return hdate.getMonthName() === 'Kislev' && hdate.getDate() >= 25;
  }

  if (point.kind === 'lagBaomerShavuot') {
    return (
      (hdate.getMonthName() === 'Iyyar' && hdate.getDate() === 18) ||
      (hdate.getMonthName() === 'Sivan' && hdate.getDate() === 6)
    );
  }

  const targets = pointToTargetHDate(point, hdate);
  return targets.some((target) => targetMatchesDisplayDate(target, hdate, rule, timing));
}

function rangeMatchesDate(
  startExpression: string,
  endExpression: string,
  hdate: HDate,
  recordMonth: string,
  rule: string,
  record: KnowledgeRecord,
): boolean {
  const normalizedEnd = endExpression.trim().startsWith('עד ')
    ? endExpression.trim().replace(/^עד\s+/u, '')
    : endExpression.trim();

  const startPoint = parseExactPoint(startExpression, recordMonth);
  const endPoint = parseExactPoint(normalizedEnd, recordMonth);

  if (
    startPoint?.kind === 'monthDayRelative' &&
    startPoint.day === 1 &&
    startPoint.relativeMonth === 'current' &&
    endPoint?.kind === 'monthDayRelative' &&
    endPoint.relativeMonth === 'previous'
  ) {
    return matchesRoshChodeshSpan(hdate);
  }

  if (!startPoint || !endPoint) {
    return expressionMatchesDate(startExpression, hdate, recordMonth, rule, record);
  }

  if (startPoint.kind === 'monthDay' && endPoint.kind === 'monthDay') {
    const startEnglish = hebrewMonthLabelToEnglish(startPoint.monthLabel);
    const endEnglish = hebrewMonthLabelToEnglish(endPoint.monthLabel);
    if (!startEnglish || !endEnglish) {
      return false;
    }

    if (startPoint.monthLabel === endPoint.monthLabel) {
      return (
        hdateMatchesEnglishMonth(hdate, startEnglish) &&
        hdate.getDate() >= startPoint.day &&
        hdate.getDate() <= endPoint.day
      );
    }

    const rangeStart = hdateFromEnglishMonthDay(startPoint.day, startEnglish, hdate.getFullYear());
    let rangeEnd = hdateFromEnglishMonthDay(endPoint.day, endEnglish, hdate.getFullYear());
    if (rangeEnd.abs() < rangeStart.abs()) {
      rangeEnd = hdateFromEnglishMonthDay(endPoint.day, endEnglish, hdate.getFullYear() + 1);
    }

    const current = hdate.abs();
    return current >= rangeStart.abs() && current <= rangeEnd.abs();
  }

  if (startPoint.kind === 'monthDayRelative' && endPoint.kind === 'monthDayRelative') {
    if (startPoint.relativeMonth === 'current' && endPoint.relativeMonth === 'current') {
      return hdate.getDate() >= startPoint.day && hdate.getDate() <= endPoint.day;
    }
  }

  return (
    expressionMatchesDate(startExpression, hdate, recordMonth, rule, record) ||
    expressionMatchesDate(normalizedEnd, hdate, recordMonth, rule, record)
  );
}

export function minhagRecordKey(record: KnowledgeRecord): string {
  return [
    record['שם קצר'],
    record['חודש'],
    record['תאריך / כלל'],
    record['תאריך מדויק 1'],
    record['פרט קצר'],
  ].join('|');
}

export function dedupeMinhagRecords(records: KnowledgeRecord[]): KnowledgeRecord[] {
  const seen = new Set<string>();
  const result: KnowledgeRecord[] = [];

  for (const record of records) {
    const key = minhagRecordKey(record);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(record);
  }

  return result;
}

export function matchesMinhagExactDateRecord(
  record: KnowledgeRecord,
  date: Date,
  hdate: HDate,
): boolean {
  const recordMonth = record['חודש']?.trim() ?? '';
  const rule = record['תאריך / כלל']?.trim() ?? '';
  const exact1 = record['תאריך מדויק 1']?.trim() ?? '';
  const exact2 = record['תאריך מדויק 2 / סיום']?.trim() ?? '';

  if (!exact1) {
    return false;
  }

  if (isShabbatMinhagRecord(record)) {
    if (isFriday(date) || date.getDay() === 6) {
      const friday = new Date(date);
      if (friday.getDay() === 6) {
        friday.setDate(friday.getDate() - 1);
      }
      friday.setHours(12, 0, 0, 0);
      if (matchesShabbatMinhagRecord(record, friday)) {
        return true;
      }
    }
  }

  if (exact2) {
    if (rangeMatchesDate(exact1, exact2, hdate, recordMonth, rule, record)) {
      return true;
    }
  }

  if (expressionMatchesDate(exact1, hdate, recordMonth, rule, record)) {
    return true;
  }

  if (exact2 && expressionMatchesDate(exact2, hdate, recordMonth, rule, record)) {
    return true;
  }

  if (recordMonth !== 'כל השנה' && recordMonth !== '') {
    const englishMonth = hebrewMonthLabelToEnglish(recordMonth);
    if (englishMonth && hdateMatchesEnglishMonth(hdate, englishMonth)) {
      const dayOnly = parseHebrewNumeral(exact1);
      if (dayOnly !== null && hdate.getDate() === dayOnly) {
        return true;
      }
    }
  }

  return false;
}

export function isMinhagExactDateRecord(record: KnowledgeRecord): boolean {
  return Boolean(record['תאריך מדויק 1']?.trim());
}
