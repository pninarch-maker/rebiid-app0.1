/**
 * One-time converter: Excel databases -> UTF-8 JSON.
 * Run: node scripts/convert-excel-databases.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SOURCES = [
  {
    input: path.join(root, 'database/REBIID_Yahrzeit_Database_Full_Year_v1.xlsx'),
    output: path.join(root, 'src/data/yahrzeits.json'),
    /** Prefer: npm run convert:yahrzeits */
    deprecated: true,
  },
  {
    input: path.join(root, 'database/REBIID_Customs_and_Segulot_Database_v2_Exact_Dates.xlsx'),
    output: path.join(root, 'src/data/minhagimSegulot.json'),
  },
];

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
    items.push(record);
  }
  return items;
}

function convertWorkbook(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing input file: ${inputPath}`);
  }

  const workbook = XLSX.readFile(inputPath, { type: 'file', cellDates: false });
  const sheets = {};
  for (const sheetName of workbook.SheetNames) {
    sheets[sheetName] = sheetToRows(workbook, sheetName);
  }

  const payload = {
    sourceFile: path.basename(inputPath),
    sheets,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const rowCount = Object.values(sheets).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`Wrote ${outputPath} (${rowCount} rows across ${workbook.SheetNames.length} sheet(s))`);
  console.log(`  Sheets: ${workbook.SheetNames.join(', ')}`);
  if (workbook.SheetNames[0]) {
    const firstRows = sheets[workbook.SheetNames[0]];
    if (firstRows[0]) {
      console.log(`  Columns: ${Object.keys(firstRows[0]).join(' | ')}`);
    }
  }
}

for (const source of SOURCES) {
  convertWorkbook(source.input, source.output);
}

console.log('Done.');
