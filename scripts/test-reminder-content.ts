/**
 * Reminder content overlay checks.
 * Run: npm run test:reminder-content
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

import { CATALOG_REMINDER_RULES } from '../src/data/reminders/catalogRulesOnly';
import { BUILT_IN_REMINDER_RULES } from '../src/data/reminders/index';
import {
  REMINDER_CONTENT_SHEET,
  REMINDER_CONTENT_SOURCE_WORKBOOK,
  applyReminderContent,
  buildReminderContentDatabase,
  contentRecordFromRule,
  validateReminderContentAgainstCatalog,
  type ReminderContentRecord,
} from '../src/data/reminders/reminderContent';
import reminderContentRaw from '../src/data/reminders/generated/reminderContent.generated.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = fs.existsSync(path.join(process.cwd(), 'database'))
  ? process.cwd()
  : path.resolve(__dirname, '..');
const WORKBOOK = path.join(root, 'database', REMINDER_CONTENT_SOURCE_WORKBOOK);
const GENERATED = path.join(
  root,
  'src/data/reminders/generated/reminderContent.generated.json',
);

function assertTrue(label: string, value: boolean): void {
  if (!value) {
    throw new Error(label);
  }
  console.log(`✓ ${label}`);
}

function assertCount(label: string, actual: number, expected: number): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${label}: ${actual}`);
}

assertCount('Catalog rule count', CATALOG_REMINDER_RULES.length, 120);
assertCount('Built-in rule count after overlay', BUILT_IN_REMINDER_RULES.length, 120);
assertCount(
  'Generated record count',
  (reminderContentRaw as { recordCount: number }).recordCount,
  120,
);

assertTrue(
  'Generated metadata contentVersion present',
  typeof (reminderContentRaw as { contentVersion?: string }).contentVersion === 'string' &&
    Boolean((reminderContentRaw as { contentVersion: string }).contentVersion),
);
assertTrue(
  'Generated metadata generatedAt is deterministic content stamp',
  String((reminderContentRaw as { generatedAt: string }).generatedAt).startsWith('content:'),
);

const catalogIds = CATALOG_REMINDER_RULES.map((rule) => rule.id).sort();
const builtInIds = BUILT_IN_REMINDER_RULES.map((rule) => rule.id).sort();
assertTrue(
  'Overlay preserves catalog reminder IDs',
  JSON.stringify(catalogIds) === JSON.stringify(builtInIds),
);

for (let index = 0; index < CATALOG_REMINDER_RULES.length; index += 1) {
  const catalog = CATALOG_REMINDER_RULES[index]!;
  const builtIn = BUILT_IN_REMINDER_RULES.find((rule) => rule.id === catalog.id);
  if (!builtIn) {
    throw new Error(`Missing built-in rule for ${catalog.id}`);
  }
  if (builtIn.title !== catalog.title || builtIn.message !== catalog.message) {
    throw new Error(
      `Reminder output changed for ${catalog.id}: catalog title/message differ from overlay result`,
    );
  }
  if (builtIn.triggerType !== catalog.triggerType) {
    throw new Error(`Trigger changed for ${catalog.id}`);
  }
}
console.log('✓ Initial migration preserves reminder titles, messages and trigger types');

assertTrue('Workbook exists', fs.existsSync(WORKBOOK));
const workbook = XLSX.readFile(WORKBOOK, { type: 'file', cellDates: false });
assertTrue(
  'Workbook contains reminder_content sheet',
  workbook.SheetNames.includes(REMINDER_CONTENT_SHEET),
);

const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
  workbook.Sheets[REMINDER_CONTENT_SHEET]!,
  { defval: '', raw: false },
);
assertCount('Workbook imported row count', sheetRows.length, 120);

const baseline = CATALOG_REMINDER_RULES.map((rule) => contentRecordFromRule(rule, '1.0.0'));
validateReminderContentAgainstCatalog(baseline, CATALOG_REMINDER_RULES);
console.log('✓ Baseline content validates against catalog');

const first = structuredClone(baseline[0]!) as ReminderContentRecord;
const duplicateProbe = [...baseline, { ...first, notes: 'dup' }];
let duplicateFailed = false;
try {
  validateReminderContentAgainstCatalog(duplicateProbe, CATALOG_REMINDER_RULES);
} catch {
  duplicateFailed = true;
}
assertTrue('Duplicate IDs are rejected', duplicateFailed);

const missingTitle = structuredClone(baseline) as ReminderContentRecord[];
missingTitle[0] = { ...missingTitle[0]!, title_he: '' };
let missingTitleFailed = false;
try {
  validateReminderContentAgainstCatalog(missingTitle, CATALOG_REMINDER_RULES);
} catch {
  missingTitleFailed = true;
}
assertTrue('Missing title is rejected', missingTitleFailed);

const badCategory = structuredClone(baseline) as ReminderContentRecord[];
badCategory[0] = { ...badCategory[0]!, category: 'not_a_category' as ReminderContentRecord['category'] };
let badCategoryFailed = false;
try {
  validateReminderContentAgainstCatalog(badCategory, CATALOG_REMINDER_RULES);
} catch {
  badCategoryFailed = true;
}
assertTrue('Invalid category is rejected', badCategoryFailed);

const badRef = structuredClone(baseline) as ReminderContentRecord[];
const patternRow = badRef.find((row) => row.rule_type === 'special_calendar_pattern');
if (!patternRow) {
  throw new Error('Expected a special_calendar_pattern row for reference test');
}
patternRow.rule_reference = 'does_not_exist';
let badRefFailed = false;
try {
  validateReminderContentAgainstCatalog(badRef, CATALOG_REMINDER_RULES);
} catch {
  badRefFailed = true;
}
assertTrue('Missing rule reference is rejected', badRefFailed);

const db = buildReminderContentDatabase(baseline, '1.0.0');
const applied = applyReminderContent(CATALOG_REMINDER_RULES, db);
assertCount('applyReminderContent preserves count', applied.length, 120);

const regenerated = `${JSON.stringify(buildReminderContentDatabase(baseline, '1.0.0'), null, 2)}\n`;
const onDisk = fs.readFileSync(GENERATED, 'utf8');
assertTrue(
  'Deterministic regeneration matches generated JSON',
  regenerated === onDisk,
);

console.log('All reminder content checks passed.');
