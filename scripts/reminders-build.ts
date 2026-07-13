/**
 * Build / validate reminder content:
 *   database/REBIID_Reminders_Master.xlsx
 *   → src/data/reminders/generated/reminderContent.generated.json
 *
 * Run:
 *   npm run reminders:build
 *   npm run reminders:validate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

import { CATALOG_REMINDER_RULES as RAW_CATALOG } from '../src/data/reminders/catalogRulesOnly';
import {
  REMINDER_CONTENT_COLUMNS,
  REMINDER_CONTENT_SHEET,
  REMINDER_CONTENT_SOURCE_WORKBOOK,
  buildReminderContentDatabase,
  validateReminderContentAgainstCatalog,
  type ReminderContentRecord,
} from '../src/data/reminders/reminderContent';
import type {
  Minhag,
  ReminderCategory,
  ReminderSeverity,
  ReminderTriggerType,
} from '../src/engine/reminders/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = fs.existsSync(path.join(process.cwd(), 'database'))
  ? process.cwd()
  : path.resolve(__dirname, '..');
const INPUT = path.join(root, 'database', REMINDER_CONTENT_SOURCE_WORKBOOK);
const OUTPUT = path.join(
  root,
  'src/data/reminders/generated/reminderContent.generated.json',
);

const validateOnly = process.argv.includes('--validate-only');

function fail(message: string): never {
  console.error(`Reminder content build failed: ${message}`);
  process.exit(1);
}

function parseBoolean(value: unknown, id: string): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  if (normalized === 'TRUE' || normalized === '1' || normalized === 'YES') {
    return true;
  }
  if (normalized === 'FALSE' || normalized === '0' || normalized === 'NO' || normalized === '') {
    return false;
  }
  fail(`${id}: invalid enabled value "${String(value)}"`);
}

function parseLeadMinutes(value: unknown, id: string): number | null {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    fail(`${id}: invalid default_lead_minutes "${raw}"`);
  }
  return parsed;
}

function readWorkbookRecords(): ReminderContentRecord[] {
  if (!fs.existsSync(INPUT)) {
    fail(`Missing workbook: ${INPUT}`);
  }

  const workbook = XLSX.readFile(INPUT, { type: 'file', cellDates: false });
  if (!workbook.SheetNames.includes(REMINDER_CONTENT_SHEET)) {
    fail(
      `Expected sheet "${REMINDER_CONTENT_SHEET}" not found. Available: ${workbook.SheetNames.join(', ')}`,
    );
  }

  const sheet = workbook.Sheets[REMINDER_CONTENT_SHEET];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  if (rows.length === 0) {
    fail('Workbook sheet has no data rows');
  }

  const first = rows[0] ?? {};
  for (const column of REMINDER_CONTENT_COLUMNS) {
    if (!(column in first)) {
      fail(`Required column missing: "${column}"`);
    }
  }

  return rows.map((row, index) => {
    const id = String(row.id ?? '').trim();
    if (!id) {
      fail(`Row ${index + 2}: missing id`);
    }

    return {
      id,
      enabled: parseBoolean(row.enabled, id),
      category: String(row.category ?? '').trim() as ReminderCategory,
      title_he: String(row.title_he ?? '').trim(),
      body_he: String(row.body_he ?? '').trim(),
      short_label_he: String(row.short_label_he ?? '').trim(),
      default_lead_minutes: parseLeadMinutes(row.default_lead_minutes, id),
      priority: String(row.priority ?? 'info').trim() as ReminderSeverity,
      minhag_scope: String(row.minhag_scope ?? 'all').trim() as Minhag,
      rule_type: String(row.rule_type ?? '').trim() as ReminderTriggerType,
      rule_reference: String(row.rule_reference ?? '').trim(),
      source: String(row.source ?? 'built_in').trim(),
      notes: String(row.notes ?? '').trim(),
      content_version: String(row.content_version ?? '').trim(),
    };
  });
}

// Catalog without content overlay — export from catalogRulesOnly.
const catalogRules = RAW_CATALOG;

let previousRecordCount: number | undefined;
if (fs.existsSync(OUTPUT)) {
  try {
    const previous = JSON.parse(fs.readFileSync(OUTPUT, 'utf8')) as { recordCount?: number };
    if (typeof previous.recordCount === 'number') {
      previousRecordCount = previous.recordCount;
    }
  } catch {
    // Ignore unreadable previous output; validation still checks catalog length.
  }
}

const records = readWorkbookRecords();

try {
  validateReminderContentAgainstCatalog(records, catalogRules, { previousRecordCount });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const contentVersion = records[0]?.content_version ?? '1.0.0';
const database = buildReminderContentDatabase(records, contentVersion);

const serialized = `${JSON.stringify(database, null, 2)}\n`;

if (validateOnly) {
  console.log('=== Reminder content validation ===');
  console.log(`Workbook: ${INPUT}`);
  console.log(`Sheet: ${REMINDER_CONTENT_SHEET}`);
  console.log(`Catalog rules: ${catalogRules.length}`);
  console.log(`Imported rows: ${records.length}`);
  console.log(`contentVersion: ${database.contentVersion}`);
  console.log('Validation passed (no write).');
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, serialized, 'utf8');

console.log('=== Reminder content build ===');
console.log(`Workbook: ${INPUT}`);
console.log(`Sheet: ${REMINDER_CONTENT_SHEET}`);
console.log(`Catalog rules: ${catalogRules.length}`);
console.log(`Imported rows: ${records.length}`);
console.log(`Rejected: 0`);
console.log(`contentVersion: ${database.contentVersion}`);
console.log(`generatedAt: ${database.generatedAt}`);
console.log(`Output: ${OUTPUT}`);
console.log('Reminder content build completed successfully.');
