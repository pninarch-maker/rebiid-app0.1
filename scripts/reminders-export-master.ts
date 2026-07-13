/**
 * Export TypeScript built-in reminder catalog → database/REBIID_Reminders_Master.xlsx
 *
 * Run: npm run reminders:export-master
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

import { CATALOG_REMINDER_RULES } from '../src/data/reminders/catalogRulesOnly';
import {
  REMINDER_CONTENT_COLUMNS,
  REMINDER_CONTENT_SHEET,
  REMINDER_CONTENT_SOURCE_WORKBOOK,
  buildReminderContentDatabase,
  contentRecordFromRule,
} from '../src/data/reminders/reminderContent';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = fs.existsSync(path.join(process.cwd(), 'database'))
  ? process.cwd()
  : path.resolve(__dirname, '..');
const OUTPUT = path.join(root, 'database', REMINDER_CONTENT_SOURCE_WORKBOOK);
const GENERATED_OUTPUT = path.join(
  root,
  'src/data/reminders/generated/reminderContent.generated.json',
);

const CONTENT_VERSION = '1.0.0';

const records = CATALOG_REMINDER_RULES.map((rule) =>
  contentRecordFromRule(rule, CONTENT_VERSION),
);

const rows = [
  [...REMINDER_CONTENT_COLUMNS],
  ...records.map((record) =>
    REMINDER_CONTENT_COLUMNS.map((column) => {
      const value = record[column];
      if (column === 'enabled') {
        return value ? 'TRUE' : 'FALSE';
      }
      if (column === 'default_lead_minutes') {
        return value === null || value === undefined ? '' : value;
      }
      return value ?? '';
    }),
  ),
];

const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(workbook, sheet, REMINDER_CONTENT_SHEET);

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
XLSX.writeFile(workbook, OUTPUT);

const database = buildReminderContentDatabase(records, CONTENT_VERSION);
fs.mkdirSync(path.dirname(GENERATED_OUTPUT), { recursive: true });
fs.writeFileSync(GENERATED_OUTPUT, `${JSON.stringify(database, null, 2)}\n`, 'utf8');

console.log('=== Reminder master export ===');
console.log(`Catalog rules: ${CATALOG_REMINDER_RULES.length}`);
console.log(`Exported rows: ${records.length}`);
console.log(`content_version: ${CONTENT_VERSION}`);
console.log(`Workbook: ${OUTPUT}`);
console.log(`Generated JSON: ${GENERATED_OUTPUT}`);
console.log('Reminder master workbook exported successfully.');
