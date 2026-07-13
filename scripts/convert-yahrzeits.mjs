/**
 * Convert Yahrzeit Excel workbook -> UTF-8 JSON runtime file.
 *
 * Source of truth:
 *   database/REBIID_Yahrzeit_Database_Full_Year_v1.xlsx
 * Output:
 *   src/data/yahrzeits.json
 *
 * Run: npm run convert:yahrzeits
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const INPUT = path.join(root, 'database/REBIID_Yahrzeit_Database_Full_Year_v1.xlsx');
const OUTPUT = path.join(root, 'src/data/yahrzeits.json');
const MAIN_SHEET = 'יארצייטים';

const REQUIRED_COLUMNS = ['חודש', 'יום', 'שם'];

/** Canonical Hebrew month labels used by the knowledge matcher. */
const MONTH_ALIASES = {
  תמוז: 'תמוז',
  Tamuz: 'תמוז',
  Tammuz: 'תמוז',
  חשון: 'חשוון',
  מרחשוון: 'חשוון',
  'אדר א': 'אדר א׳',
  'אדר א׳': 'אדר א׳',
  "אדר א'": 'אדר א׳',
  'אדר ב': 'אדר ב׳',
  'אדר ב׳': 'אדר ב׳',
  "אדר ב'": 'אדר ב׳',
  'אדר II': 'אדר ב׳',
};

const GEMATRIA_VALUES = {
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

function cellToValue(cell) {
  if (cell === null || cell === undefined) {
    return '';
  }
  if (typeof cell === 'string') {
    return cell;
  }
  if (typeof cell === 'number' || typeof cell === 'boolean') {
    return cell;
  }
  return String(cell);
}

function isEmptyRow(row) {
  return !row || row.every((cell) => String(cell ?? '').trim() === '');
}

function normalizeWhitespace(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMonthLabel(value) {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return '';
  }
  return MONTH_ALIASES[trimmed] ?? trimmed;
}

function parseHebrewNumeral(value) {
  const cleaned = normalizeWhitespace(value)
    .replace(/["']/g, '')
    .replace(/״/g, '')
    .replace(/׳/g, '')
    .replace(/\s+/g, '');

  if (!cleaned) {
    return null;
  }

  const asNumber = Number.parseInt(cleaned, 10);
  if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= 30) {
    return asNumber;
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

function buildDeterministicId(record) {
  const key = [
    normalizeMonthLabel(record['חודש']),
    normalizeWhitespace(record['יום']),
    normalizeWhitespace(record['שם']),
    normalizeWhitespace(record['פרט קצר']),
    normalizeWhitespace(record['סוג תאריך']),
    normalizeWhitespace(record['שיוך']),
  ].join('|');

  const hash = createHash('sha1').update(key, 'utf8').digest('hex').slice(0, 12);
  return `yz:${hash}`;
}

function fail(message) {
  console.error(`Yahrzeit import failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(INPUT)) {
  fail(`Missing workbook: ${INPUT}`);
}

const workbook = XLSX.readFile(INPUT, { type: 'file', cellDates: false });

if (!workbook.SheetNames.includes(MAIN_SHEET)) {
  fail(
    `Expected sheet "${MAIN_SHEET}" not found. Available: ${workbook.SheetNames.join(', ')}`,
  );
}

const sheet = workbook.Sheets[MAIN_SHEET];
const rawRows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  raw: false,
  defval: '',
});

if (rawRows.length === 0) {
  fail('Workbook sheet is empty');
}

const headers = rawRows[0].map((header) => normalizeWhitespace(header));
for (const required of REQUIRED_COLUMNS) {
  if (!headers.includes(required)) {
    fail(`Required column missing: "${required}". Found: ${headers.join(' | ')}`);
  }
}

const imported = [];
const rejected = [];
const seenIds = new Set();
let duplicateCount = 0;
let skippedEmptyRows = 0;
const perMonth = {};

for (let rowIndex = 1; rowIndex < rawRows.length; rowIndex += 1) {
  const row = rawRows[rowIndex];
  if (isEmptyRow(row)) {
    skippedEmptyRows += 1;
    continue;
  }

  const sourceRecord = {};
  for (let colIndex = 0; colIndex < headers.length; colIndex += 1) {
    const key = headers[colIndex];
    if (!key) {
      continue;
    }
    // Preserve original Hebrew content exactly for display fields.
    sourceRecord[key] = cellToValue(row[colIndex] ?? '');
  }

  const monthRaw = normalizeWhitespace(sourceRecord['חודש']);
  const dayRaw = normalizeWhitespace(sourceRecord['יום']);
  const nameRaw = normalizeWhitespace(sourceRecord['שם']);
  const month = normalizeMonthLabel(monthRaw);
  const dayNumber = parseHebrewNumeral(dayRaw);

  if (!month || !dayRaw || !nameRaw || dayNumber === null) {
    rejected.push({
      row: rowIndex + 1,
      reason: !month
        ? 'invalid_month'
        : dayNumber === null
          ? 'invalid_day'
          : 'missing_name',
      month: monthRaw,
      day: dayRaw,
      name: nameRaw,
    });
    continue;
  }

  const record = {
    ...sourceRecord,
    חודש: month,
  };

  const id = buildDeterministicId(record);
  if (seenIds.has(id)) {
    duplicateCount += 1;
    rejected.push({
      row: rowIndex + 1,
      reason: 'duplicate_id',
      id,
      name: nameRaw,
    });
    continue;
  }

  seenIds.add(id);
  record.id = id;
  imported.push(record);
  perMonth[month] = (perMonth[month] ?? 0) + 1;
}

if (imported.length === 0) {
  fail('No rows were imported (refusing to write an empty yahrzeit database)');
}

if (duplicateCount > 0) {
  fail(`Found ${duplicateCount} duplicate deterministic IDs`);
}

const payload = {
  sourceFile: path.basename(INPUT),
  sheets: {
    [MAIN_SHEET]: imported,
    // Preserve secondary sheets for reference without treating them as yahrzeit rows.
    ...Object.fromEntries(
      workbook.SheetNames.filter((name) => name !== MAIN_SHEET).map((name) => {
        const secondary = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
          header: 1,
          raw: false,
          defval: '',
        });
        if (secondary.length === 0) {
          return [name, []];
        }
        const secondaryHeaders = secondary[0].map((header) => normalizeWhitespace(header));
        const items = [];
        for (let rowIndex = 1; rowIndex < secondary.length; rowIndex += 1) {
          const row = secondary[rowIndex];
          if (isEmptyRow(row)) {
            continue;
          }
          const record = {};
          for (let colIndex = 0; colIndex < secondaryHeaders.length; colIndex += 1) {
            const key = secondaryHeaders[colIndex];
            if (!key) {
              continue;
            }
            record[key] = cellToValue(row[colIndex] ?? '');
          }
          items.push(record);
        }
        return [name, items];
      }),
    ),
  },
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const sourceDataRows = rawRows.length - 1 - skippedEmptyRows;

console.log('=== Yahrzeit import summary ===');
console.log(`Workbook path: ${INPUT}`);
console.log(`Selected sheet: ${MAIN_SHEET}`);
console.log(`Source data rows (non-empty): ${sourceDataRows}`);
console.log(`Imported row count: ${imported.length}`);
console.log(`Rejected row count: ${rejected.length}`);
console.log(`Duplicate count: ${duplicateCount}`);
console.log(`Skipped empty rows: ${skippedEmptyRows}`);
console.log('Records per Hebrew month:');
for (const [month, count] of Object.entries(perMonth).sort((a, b) => a[0].localeCompare(b[0], 'he'))) {
  console.log(`  ${month}: ${count}`);
}
console.log(`Output path: ${OUTPUT}`);

if (rejected.length > 0) {
  console.log('Rejected samples:');
  for (const item of rejected.slice(0, 10)) {
    console.log(`  row ${item.row}: ${item.reason} (${item.name || item.month || ''})`);
  }
  fail(`${rejected.length} rows rejected — fix source data or converter rules`);
}

console.log('Yahrzeit conversion completed successfully.');
