/**
 * Convert Jewish history Excel -> UTF-8 JSON runtime file.
 * Run: node scripts/convert-jewish-history.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const INPUT = path.join(root, 'database/REBIID_Jewish_History_522_Events_v2.xlsx');
const OUTPUT = path.join(root, 'src/data/jewishHistoryToday.json');
const MAIN_SHEET = 'דברי הימים';

/** Map v2 column names to existing runtime field names. */
const COLUMN_ALIASES = {
  'פרט קצר': 'תיאור קצר',
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
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
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

if (!fs.existsSync(INPUT)) {
  throw new Error(`Missing input file: ${INPUT}`);
}

const workbook = XLSX.readFile(INPUT, { type: 'file', cellDates: false });
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
let missingHebrewDate = 0;

for (const row of mainRows) {
  const month = String(row['חודש'] ?? '').trim();
  const day = String(row['יום'] ?? '').trim();
  if (!month || !day) {
    missingHebrewDate += 1;
  }
}

const rowCount = Object.values(sheets).reduce((sum, rows) => sum + rows.length, 0);
console.log(`Wrote ${OUTPUT}`);
console.log(`Imported ${mainRows.length} history records from "${MAIN_SHEET}" (${rowCount} rows across all sheets)`);
console.log(`Rows with missing Hebrew date fields: ${missingHebrewDate}`);
console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
if (mainRows[0]) {
  console.log(`Columns: ${Object.keys(mainRows[0]).join(' | ')}`);
}
