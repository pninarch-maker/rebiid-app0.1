import type { KnowledgeRecord } from './matchRecords';

export type { KnowledgeRecord };

export interface ExcelKnowledgeDatabase {
  sourceFile: string;
  sheets: Record<string, KnowledgeRecord[]>;
}

export interface TodayKnowledgeSections {
  yahrzeits: KnowledgeRecord[];
  minhagimSegulot: KnowledgeRecord[];
  jewishHistory: KnowledgeRecord[];
}

export function hasHomeKnowledgeSections(sections: TodayKnowledgeSections): boolean {
  return sections.yahrzeits.length > 0 || sections.minhagimSegulot.length > 0;
}

export function hasJewishHistoryForDate(sections: TodayKnowledgeSections): boolean {
  return sections.jewishHistory.length > 0;
}
