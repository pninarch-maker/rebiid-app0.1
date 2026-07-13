import { HDate } from '@hebcal/core';

import {
  JEWISH_HISTORY_ROWS,
  MINHAG_ROWS,
  YAHRZEIT_ROWS,
} from '@/src/data/knowledge/loadDatabase';
import { dedupeMinhagRecords } from '@/src/data/knowledge/minhagExactMatch';
import {
  matchesJewishHistoryRecord,
  matchesMinhagRecord,
  matchesYahrzeitRecord,
} from '@/src/data/knowledge/matchRecords';
import type { KnowledgeRecord, TodayKnowledgeSections } from '@/src/data/knowledge/types';
import { getShabbatDate, isFriday } from '@/src/data/knowledge/hebrewDate';
import { toGregorianDateOnly } from '@/src/engine/zmanim/formatTime';

export type { KnowledgeRecord, TodayKnowledgeSections };
export {
  hasHomeKnowledgeSections,
  hasJewishHistoryForDate,
} from '@/src/data/knowledge/types';

function toKnowledgeHDate(date: Date): HDate {
  return new HDate(toGregorianDateOnly(date));
}

function yahrzeitRecordKey(record: KnowledgeRecord): string {
  if (record.id?.trim()) {
    return record.id.trim();
  }

  return [
    record['חודש'] ?? '',
    record['יום'] ?? '',
    record['שם'] ?? '',
    record['פרט קצר'] ?? '',
  ].join('|');
}

function dedupeYahrzeitRecords(records: KnowledgeRecord[]): KnowledgeRecord[] {
  const seen = new Set<string>();
  const result: KnowledgeRecord[] = [];

  for (const record of records) {
    const key = yahrzeitRecordKey(record);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(record);
  }

  return result;
}

/**
 * Yahrzeits for a Gregorian date (informational only — never creates notifications).
 * On Friday, also include Shabbat yahrzeits without duplicates.
 */
export function getYahrzeitsForDate(date: Date = new Date()): KnowledgeRecord[] {
  const hdate = toKnowledgeHDate(date);
  const todayRows = YAHRZEIT_ROWS.filter((record) => matchesYahrzeitRecord(record, hdate));

  if (!isFriday(date)) {
    return dedupeYahrzeitRecords(todayRows);
  }

  const shabbatHDate = toKnowledgeHDate(getShabbatDate(date));
  const shabbatRows = YAHRZEIT_ROWS.filter((record) =>
    matchesYahrzeitRecord(record, shabbatHDate),
  );

  return dedupeYahrzeitRecords([...todayRows, ...shabbatRows]);
}

export function getMinhagimSegulotForDate(date: Date = new Date()): KnowledgeRecord[] {
  const normalized = toGregorianDateOnly(date);
  const hdate = toKnowledgeHDate(date);
  const matched = MINHAG_ROWS.filter((record) => matchesMinhagRecord(record, normalized, hdate));
  return dedupeMinhagRecords(matched);
}

export function getJewishHistoryForDate(date: Date = new Date()): KnowledgeRecord[] {
  const hdate = toKnowledgeHDate(date);
  return JEWISH_HISTORY_ROWS.filter((record) => matchesJewishHistoryRecord(record, hdate));
}

export function getTodayKnowledgeSections(date: Date = new Date()): TodayKnowledgeSections {
  return {
    yahrzeits: getYahrzeitsForDate(date),
    minhagimSegulot: getMinhagimSegulotForDate(date),
    jewishHistory: getJewishHistoryForDate(date),
  };
}

/** @deprecated Use getTodayKnowledgeSections */
export function getTodayKnowledge(date: Date = new Date()): TodayKnowledgeSections {
  return getTodayKnowledgeSections(date);
}

/** @deprecated Use getTodayKnowledgeSections */
export function getKnowledgeForDate(date: Date): TodayKnowledgeSections {
  return getTodayKnowledgeSections(date);
}

/** @deprecated Use hasHomeKnowledgeSections */
export function hasTodayKnowledge(sections: TodayKnowledgeSections): boolean {
  return sections.yahrzeits.length > 0 || sections.minhagimSegulot.length > 0;
}
