/**
 * Knowledge database matching checks.
 * Run: npm run test:knowledge
 */
import { HDate } from '@hebcal/core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

import {
  getJewishHistoryForDate,
  getMinhagimSegulotForDate,
  getYahrzeitsForDate,
} from '../lib/knowledgeService';
import {
  JEWISH_HISTORY_ROWS,
  MINHAG_ROWS,
  YAHRZEIT_ROWS,
  yahrzeitsDatabase,
} from '../src/data/knowledge/loadDatabase';
import { dedupeMinhagRecords, minhagRecordKey } from '../src/data/knowledge/minhagExactMatch';
import {
  hebrewMonthLabelToEnglish,
  matchesHebrewMonthDay,
  parseHebrewNumeral,
} from '../src/data/knowledge/hebrewDate';
import { matchesJewishHistoryRecord, matchesYahrzeitRecord } from '../src/data/knowledge/matchRecords';
import { hasJewishHistoryForDate } from '../src/data/knowledge/types';
import { toGregorianDateOnly } from '../src/engine/zmanim/formatTime';

// Prefer cwd (npm scripts run from repo root). Bundled output lives under scripts/.test-out/,
// so fileURLToPath(__dirname) alone would resolve the workbook incorrectly.
const root = fs.existsSync(path.join(process.cwd(), 'database'))
  ? process.cwd()
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const YAHRZEIT_XLSX = path.join(root, 'database', 'REBIID_Yahrzeit_Database_Full_Year_v1.xlsx');

function assertCount(label: string, actual: number, expected: number): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${label}: ${actual}`);
}

function assertTrue(label: string, value: boolean): void {
  if (!value) {
    throw new Error(`${label}: expected true`);
  }
  console.log(`✓ ${label}`);
}

function assertAtLeast(label: string, actual: number, minimum: number): void {
  if (actual < minimum) {
    throw new Error(`${label}: expected >= ${minimum}, got ${actual}`);
  }
  console.log(`✓ ${label}: ${actual}`);
}

function findEmptyHistoryDate(): Date {
  for (let month = 1; month <= 13; month += 1) {
    for (let day = 1; day <= 30; day += 1) {
      try {
        const hdate = new HDate(day, month, 5786);
        const gregorian = hdate.greg();
        if (getJewishHistoryForDate(gregorian).length === 0) {
          return gregorian;
        }
      } catch {
        // Skip invalid Hebrew dates in this year.
      }
    }
  }

  throw new Error('No empty history date found in 5786');
}

function historyRecordKey(record: (typeof JEWISH_HISTORY_ROWS)[number]): string {
  return [
    record['חודש'],
    record['יום'],
    record['אירוע'],
    record['שנה / תקופה'],
    record['תיאור קצר'],
  ].join('|');
}

function assertNoDuplicateHistoryEvents(label: string, records: typeof JEWISH_HISTORY_ROWS): void {
  const seen = new Set<string>();
  for (const record of records) {
    const key = historyRecordKey(record);
    if (seen.has(key)) {
      throw new Error(`${label}: duplicate history event "${record['אירוע']}"`);
    }
    seen.add(key);
  }
  console.log(`✓ ${label}: ${records.length} unique events`);
}

function countExcelYahrzeitRows(): number {
  if (!fs.existsSync(YAHRZEIT_XLSX)) {
    throw new Error(`Missing yahrzeit workbook: ${YAHRZEIT_XLSX}`);
  }

  const workbook = XLSX.readFile(YAHRZEIT_XLSX, { type: 'file', cellDates: false });
  const sheet = workbook.Sheets['יארצייטים'];
  if (!sheet) {
    throw new Error('Missing יארצייטים sheet in workbook');
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];
  let count = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
      continue;
    }
    count += 1;
  }
  return count;
}

console.log(
  `Loaded rows: yahrzeits=${YAHRZEIT_ROWS.length}, minhagim=${MINHAG_ROWS.length}, history=${JEWISH_HISTORY_ROWS.length}`,
);

assertAtLeast('Yahrzeit JSON imported count', YAHRZEIT_ROWS.length, 1);
assertTrue('Yahrzeit sourceFile recorded', Boolean(yahrzeitsDatabase.sourceFile));
assertTrue(
  'Every yahrzeit has deterministic id',
  YAHRZEIT_ROWS.every((row) => typeof row.id === 'string' && row.id.startsWith('yz:')),
);

const excelRowCount = countExcelYahrzeitRows();
assertCount('Yahrzeit JSON matches Excel accepted rows', YAHRZEIT_ROWS.length, excelRowCount);
console.log(`✓ Excel import produces records from ${path.basename(YAHRZEIT_XLSX)}`);

assertCount('Jewish history row count', JEWISH_HISTORY_ROWS.length, 522);
assertCount('Minhagim row count', MINHAG_ROWS.length, 142);

if (MINHAG_ROWS[0]?.['תאריך / כלל']?.trim().length === 0) {
  throw new Error('Minhag record missing mapped rule field');
}
if (!MINHAG_ROWS[0]?.['תאריך מדויק 1']?.trim()) {
  throw new Error('Minhag record missing exact Hebrew date field');
}
console.log('✓ Minhag records preserve exact Hebrew date columns');

const tishrei1 = new Date(2025, 8, 23);
const hdate = new HDate(toGregorianDateOnly(tishrei1));
const sample = JEWISH_HISTORY_ROWS[0];
if (!sample) {
  throw new Error('Missing history rows');
}
if (parseHebrewNumeral(sample['יום']) !== 1) {
  throw new Error(`Unexpected day parse: ${sample['יום']} -> ${parseHebrewNumeral(sample['יום'])}`);
}
if (hebrewMonthLabelToEnglish(sample['חודש']) !== 'Tishrei') {
  throw new Error(`Unexpected month map: ${sample['חודש']}`);
}
if (hdate.getDate() !== 1 || hdate.getMonthName() !== 'Tishrei') {
  throw new Error(`Unexpected HDate: ${hdate.toString()}`);
}
if (!matchesJewishHistoryRecord(sample, hdate)) {
  throw new Error('Direct history match failed for first Tishrei record');
}
console.log('✓ Direct history match for 1 Tishrei sample');

const tishrei1Events = getJewishHistoryForDate(tishrei1);
assertCount('History on 1 Tishrei 5786', tishrei1Events.length, 11);
assertTrue('Multiple history events on 1 Tishrei', tishrei1Events.length > 1);
assertNoDuplicateHistoryEvents('No duplicate history events on 1 Tishrei', tishrei1Events);

const tishrei27 = new Date(2025, 9, 19);
const tishrei27Events = getJewishHistoryForDate(tishrei27);
assertCount('History on 27 Tishrei 5786', tishrei27Events.length, 3);
assertNoDuplicateHistoryEvents('No duplicate history events on 27 Tishrei', tishrei27Events);

const nisan3 = findEmptyHistoryDate();
const emptyHistory = getJewishHistoryForDate(nisan3);
assertCount(`History on ${new HDate(nisan3).toString()} (empty)`, emptyHistory.length, 0);
assertTrue(
  'Empty history hides FAB state',
  !hasJewishHistoryForDate({ yahrzeits: [], minhagimSegulot: [], jewishHistory: emptyHistory }),
);

const yomKippurYahrzeit = new Date(2025, 9, 2);
const tishrei10Yahrzeits = getYahrzeitsForDate(yomKippurYahrzeit);
assertAtLeast('Yahrzeits on 10 Tishrei 5786', tishrei10Yahrzeits.length, 1);
assertTrue(
  '10 Tishrei includes רבי עקיבא',
  tishrei10Yahrzeits.some((item) => item['שם'] === 'רבי עקיבא'),
);

const july12_2026 = new Date(2026, 6, 12);
july12_2026.setHours(12, 0, 0, 0);
const tamuz27HDate = new HDate(toGregorianDateOnly(july12_2026));
if (tamuz27HDate.getMonthName() !== 'Tamuz' || tamuz27HDate.getDate() !== 27) {
  throw new Error(`Expected 27 Tamuz 5786 for 2026-07-12, got ${tamuz27HDate.toString()}`);
}
const tamuz27Yahrzeits = getYahrzeitsForDate(july12_2026);
assertAtLeast('Yahrzeits on 27 Tammuz 5786', tamuz27Yahrzeits.length, 1);
assertTrue(
  'Excel/JSON contain 27 תמוז records',
  YAHRZEIT_ROWS.some(
    (row) => row['חודש'] === 'תמוז' && parseHebrewNumeral(row['יום'] ?? '') === 27,
  ),
);
assertTrue(
  '27 Tammuz includes אלעזר אבוחצירא',
  tamuz27Yahrzeits.some((item) => item['שם'] === 'אלעזר אבוחצירא'),
);

const fridayZachor = new Date(2025, 2, 7);
const minhagFriday = getMinhagimSegulotForDate(fridayZachor);
const shabbatZachor = minhagFriday.some((item) => item['שם קצר'] === 'שבת זכור');
if (!shabbatZachor) {
  throw new Error('Expected Shabbat Zachor minhag on Friday 2025-03-07');
}
console.log('✓ Shabbat Zachor on Friday before Zachor');

const erevYomKippur = new Date(2025, 8, 30);
const erevYomKippurMinhagim = getMinhagimSegulotForDate(erevYomKippur);
const kaparot = erevYomKippurMinhagim.some((item) => item['שם קצר'] === 'כפרות');
if (!kaparot) {
  throw new Error('Expected Kaparot on erev Yom Kippur display date (8 Tishrei)');
}
console.log('✓ Erev minhag appears on previous Hebrew date');

const tishrei1Minhagim = getMinhagimSegulotForDate(tishrei1);
if (tishrei1Minhagim.length < 2) {
  throw new Error('Expected multiple minhagim on 1 Tishrei');
}
const minhagKeys = new Set(tishrei1Minhagim.map((item) => minhagRecordKey(item)));
if (minhagKeys.size !== tishrei1Minhagim.length) {
  throw new Error('Duplicate minhag records on 1 Tishrei');
}
console.log(`✓ Multiple minhagim on 1 Tishrei without duplicates: ${tishrei1Minhagim.length}`);
assertTrue('Minhag dedupe helper', dedupeMinhagRecords(tishrei1Minhagim).length === tishrei1Minhagim.length);

const tamuz23 = new Date(2026, 6, 8);
tamuz23.setHours(12, 0, 0, 0);
const tamuz23HDate = new HDate(toGregorianDateOnly(tamuz23));
if (tamuz23HDate.getMonthName() !== 'Tamuz' || tamuz23HDate.getDate() !== 23) {
  throw new Error(`Unexpected Tamuz 23 sample date: ${tamuz23HDate.toString()}`);
}
const tamuz23Yahrzeits = getYahrzeitsForDate(tamuz23);
assertAtLeast('Yahrzeits on 23 Tamuz 5786', tamuz23Yahrzeits.length, 1);
assertTrue(
  '23 Tamuz includes רבי משה קורדובירו',
  tamuz23Yahrzeits.some((item) => item['שם'] === 'רבי משה קורדובירו'),
);

const tamuz23Minhagim = getMinhagimSegulotForDate(tamuz23);
assertAtLeast('Minhagim on 23 Tamuz 5786', tamuz23Minhagim.length, 1);

const sampleYahrzeit = tishrei10Yahrzeits[0];
if (sampleYahrzeit['שם']?.trim().length === 0) {
  throw new Error('Yahrzeit record missing Hebrew name');
}
console.log(`✓ Sample yahrzeit preserved: ${sampleYahrzeit['שם']}`);

assertTrue(
  'Month variant תמוז normalizes for matching',
  matchesHebrewMonthDay(tamuz23HDate, 'תמוז', 23),
);
assertTrue(
  'Month variant Tammuz English normalizes against Tamuz HDate',
  hebrewMonthLabelToEnglish('תמוז') === 'Tammuz',
);

const leapAdarI = new HDate(1, 'Adar I', 5784);
assertTrue('Adar I label matches leap Adar I', matchesHebrewMonthDay(leapAdarI, 'אדר א׳', 1));
const adarIRows = getYahrzeitsForDate(leapAdarI.greg());
assertAtLeast('Yahrzeits on 1 Adar I 5784', adarIRows.length, 1);
assertTrue(
  'Adar I includes רבי שבתי הכהן',
  adarIRows.some((item) => item['שם'] === 'רבי שבתי הכהן'),
);

const leapAdarII = new HDate(7, 'Adar II', 5784);
assertTrue(
  'Plain אדר matches leap Adar II (yahrzeit convention)',
  matchesHebrewMonthDay(leapAdarII, 'אדר', 7),
);
const adarIIRows = getYahrzeitsForDate(leapAdarII.greg());
assertAtLeast('Yahrzeits on 7 Adar II 5784 via plain אדר', adarIIRows.length, 1);
assertTrue(
  'Adar II date includes משה רבנו',
  adarIIRows.some((item) => item['שם'] === 'משה רבנו'),
);

// Additional workbook date: 15 Tamuz — רבי חיים בן עטר
const tamuz15 = new HDate(15, 'Tamuz', 5786).greg();
const tamuz15Rows = getYahrzeitsForDate(tamuz15);
assertAtLeast('Yahrzeits on 15 Tamuz 5786', tamuz15Rows.length, 1);
assertTrue(
  '15 Tamuz includes רבי חיים בן עטר',
  tamuz15Rows.some((item) => item['שם'] === 'רבי חיים בן עטר'),
);

// Friday includes Shabbat yahrzeits without duplicates.
function findFridayWithShabbatYahrzeits(): { friday: Date; shabbatRows: number } {
  for (let day = 1; day <= 29; day += 1) {
    const shabbatHDate = new HDate(day, 'Tamuz', 5786);
    const shabbatGreg = shabbatHDate.greg();
    const noon = new Date(
      shabbatGreg.getFullYear(),
      shabbatGreg.getMonth(),
      shabbatGreg.getDate(),
      12,
      0,
      0,
      0,
    );
    if (noon.getDay() !== 6) {
      continue;
    }
    const shabbatRows = YAHRZEIT_ROWS.filter((row) => matchesYahrzeitRecord(row, shabbatHDate));
    if (shabbatRows.length === 0) {
      continue;
    }
    const friday = new Date(noon);
    friday.setDate(friday.getDate() - 1);
    friday.setHours(12, 0, 0, 0);
    if (friday.getDay() !== 5) {
      throw new Error(`Expected Friday before Shabbat ${shabbatHDate}, got ${friday.getDay()}`);
    }
    return { friday, shabbatRows: shabbatRows.length };
  }
  throw new Error('No Shabbat with yahrzeit records found in Tamuz 5786');
}

const { friday: fridayBeforeShabbatYahrzeit, shabbatRows: expectedShabbatCount } =
  findFridayWithShabbatYahrzeits();
const fridayYahrzeits = getYahrzeitsForDate(fridayBeforeShabbatYahrzeit);
assertAtLeast(
  'Friday includes Shabbat yahrzeits',
  fridayYahrzeits.length,
  expectedShabbatCount,
);
const fridayIds = fridayYahrzeits.map((item) => item.id ?? `${item['שם']}|${item['יום']}`);
assertTrue(
  'Friday/Shabbat yahrzeits have no duplicate ids',
  new Set(fridayIds).size === fridayIds.length,
);
assertTrue(
  'Direct yahrzeit matcher still works for imported row',
  matchesYahrzeitRecord(
    YAHRZEIT_ROWS.find((row) => row['שם'] === 'רבי משה קורדובירו')!,
    tamuz23HDate,
  ),
);

console.log('All knowledge checks passed.');
