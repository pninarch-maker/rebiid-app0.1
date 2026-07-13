import yahrzeitsRaw from '@/src/data/yahrzeits.json';
import minhagimSegulotRaw from '@/src/data/minhagimSegulot.json';
import jewishHistoryTodayRaw from '@/src/data/jewishHistoryToday.json';

import type { ExcelKnowledgeDatabase, KnowledgeRecord } from './types';

function asDatabase(raw: unknown): ExcelKnowledgeDatabase {
  if (!raw || typeof raw !== 'object') {
    return { sourceFile: '', sheets: {} };
  }

  const candidate = raw as Partial<ExcelKnowledgeDatabase>;
  return {
    sourceFile: typeof candidate.sourceFile === 'string' ? candidate.sourceFile : '',
    sheets:
      candidate.sheets && typeof candidate.sheets === 'object'
        ? (candidate.sheets as Record<string, KnowledgeRecord[]>)
        : {},
  };
}

export const yahrzeitsDatabase = asDatabase(yahrzeitsRaw);
export const minhagimSegulotDatabase = asDatabase(minhagimSegulotRaw);
export const jewishHistoryDatabase = asDatabase(jewishHistoryTodayRaw);

export const YAHRZEIT_ROWS = yahrzeitsDatabase.sheets['יארצייטים'] ?? [];
export const MINHAG_ROWS = minhagimSegulotDatabase.sheets['מנהגים וסגולות'] ?? [];
export const JEWISH_HISTORY_ROWS = jewishHistoryDatabase.sheets['דברי הימים'] ?? [];
