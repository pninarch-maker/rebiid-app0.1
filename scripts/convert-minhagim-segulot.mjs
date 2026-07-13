/**
 * Convert Customs & Segulot Excel -> UTF-8 JSON runtime file.
 * Run: node scripts/convert-minhagim-segulot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

import { isExactDateExpressionValid } from './minhag-import-validation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const INPUT = path.join(root, 'database/REBIID_Customs_and_Segulot_Database_v2_Exact_Dates.xlsx');
const OUTPUT = path.join(root, 'src/data/minhagimSegulot.json');
const MAIN_SHEET = 'מנהגים וסגולות';

/** Map v2 column names to existing runtime field names. */
const COLUMN_ALIASES = {
  'כלל מקורי': 'תאריך / כלל',
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

function normalizeRecord(record) {
  const normalized = {};
  for (const [key, value] of Object.entries(record)) {
    const runtimeKey = COLUMN_ALIASES[key] ?? key;
    normalized[runtimeKey] = cellToValue(value);
  }
  return normalized;
}

function isEmptyRow(row) {
  return !row || row.every((cell) => String(cell ?? '').trim() === '');
}

function sheetToRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => String(header ?? '').trim());
  const items = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (isEmptyRow(row)) {
      continue;
    }

    const record = {};
    for (let colIndex = 0; colIndex < headers.length; colIndex += 1) {
      const key = headers[colIndex];
      if (!key) {
        continue;
      }
      record[key] = cellToValue(row[colIndex] ?? '');
    }

    items.push(normalizeRecord(record));
  }

  return items;
}

function countSheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { dataRows: 0, skippedEmptyRows: 0 };
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length <= 1) {
    return { dataRows: 0, skippedEmptyRows: 0 };
  }

  let skippedEmptyRows = 0;
  let dataRows = 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (isEmptyRow(row)) {
      skippedEmptyRows += 1;
      continue;
    }
    dataRows += 1;
  }

  return { dataRows, skippedEmptyRows };
}

if (!fs.existsSync(INPUT)) {
  throw new Error(`Missing input file: ${INPUT}`);
}

const workbook = XLSX.readFile(INPUT, { type: 'file', cellDates: false });
const { skippedEmptyRows } = countSheetRows(workbook, MAIN_SHEET);
const sheets = {};

for (const sheetName of workbook.SheetNames) {
  sheets[sheetName] = sheetToRows(workbook, sheetName);
}

const payload = {
  sourceFile: path.basename(INPUT),
  sheets,
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const mainRows = sheets[MAIN_SHEET] ?? [];
let invalidHebrewDates = 0;
const invalidSamples = [];

for (const row of mainRows) {
  const month = String(row['חודש'] ?? '').trim();
  const exact1 = String(row['תאריך מדויק 1'] ?? '').trim();
  const exact2 = String(row['תאריך מדויק 2 / סיום'] ?? '').trim();
  const rule = String(row['תאריך / כלל'] ?? '').trim();

  if (!exact1) {
    invalidHebrewDates += 1;
    invalidSamples.push(row['שם קצר'] ?? '(unnamed)');
    continue;
  }

  if (!isExactDateExpressionValid(exact1, month, rule) || (exact2 && !isExactDateExpressionValid(exact2, month, rule, true))) {
    invalidHebrewDates += 1;
    invalidSamples.push(row['שם קצר'] ?? '(unnamed)');
  }
}

console.log(`Wrote ${OUTPUT}`);
console.log(`Imported ${mainRows.length} minhag records from "${MAIN_SHEET}"`);
console.log(`Skipped empty rows: ${skippedEmptyRows}`);
console.log(`Records with invalid Hebrew dates: ${invalidHebrewDates}`);
if (invalidSamples.length > 0) {
  console.log(`Invalid samples: ${invalidSamples.slice(0, 10).join(', ')}`);
}
console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
if (mainRows[0]) {
  console.log(`Columns: ${Object.keys(mainRows[0]).join(' | ')}`);
}
