/**
 * Reminder content overlay — editable fields sourced from
 * database/REBIID_Reminders_Master.xlsx → reminderContent.generated.json.
 *
 * Scheduling / calendar logic stays in TypeScript catalog + patterns.
 */

import type {
  BuiltInReminderRule,
  Minhag,
  ReminderCategory,
  ReminderSeverity,
  ReminderTriggerType,
} from '@/src/engine/reminders/types';

/** Pattern IDs mirrored from patterns.ts — kept here to avoid pulling the matcher graph into content tooling. */
const KNOWN_PATTERN_IDS = new Set<string>([
  'rosh_chodesh_today',
  'rosh_chodesh_tomorrow',
  'omer_daily',
  'omer_first_night',
  'chanukah_first_night',
  'chanukah_friday',
  'chanukah_motzei_shabbat',
  'eruv_tavshilin',
  'prepare_existing_flame',
  'rosh_chodesh_iyar_friday',
  'ashkenazi_selichot',
  'tisha_bav_postponed',
  'yom_tov_shabbat_follows',
  'birkat_hachama_eve',
  'birkat_hachama_day',
  'taanit_bechorot_day',
  'taanit_bechorot_eve',
  'erev_rosh_chodesh_sivan',
  'yom_kippur_katan',
]);

export const REMINDER_CONTENT_SCHEMA_VERSION = 1;
export const REMINDER_CONTENT_SHEET = 'reminder_content';
export const REMINDER_CONTENT_SOURCE_WORKBOOK = 'REBIID_Reminders_Master.xlsx';

export const REMINDER_CONTENT_COLUMNS = [
  'id',
  'enabled',
  'category',
  'title_he',
  'body_he',
  'short_label_he',
  'default_lead_minutes',
  'priority',
  'minhag_scope',
  'rule_type',
  'rule_reference',
  'source',
  'notes',
  'content_version',
] as const;

export type ReminderContentColumn = (typeof REMINDER_CONTENT_COLUMNS)[number];

export interface ReminderContentRecord {
  id: string;
  enabled: boolean;
  category: ReminderCategory;
  title_he: string;
  body_he: string;
  short_label_he: string;
  default_lead_minutes: number | null;
  priority: ReminderSeverity;
  minhag_scope: Minhag;
  rule_type: ReminderTriggerType;
  rule_reference: string;
  source: string;
  notes: string;
  content_version: string;
}

export interface ReminderContentDatabase {
  schemaVersion: number;
  contentVersion: string;
  /** Deterministic stamp — derived from contentVersion, not wall-clock time. */
  generatedAt: string;
  sourceWorkbook: string;
  recordCount: number;
  records: ReminderContentRecord[];
}

export const VALID_REMINDER_CATEGORIES: readonly ReminderCategory[] = [
  'shabbat',
  'rosh_chodesh',
  'prayer',
  'fast',
  'rosh_hashanah',
  'yom_kippur',
  'sukkot',
  'chanukah',
  'purim',
  'pesach',
  'omer',
  'shavuot',
  'three_weeks',
  'elul',
  'special_events',
  'minhag_segulah',
  'personal',
] as const;

export const VALID_RULE_TYPES: readonly ReminderTriggerType[] = [
  'hebrew_date',
  'holiday',
  'weekday',
  'relative_to_holiday',
  'relative_to_zman',
  'special_calendar_pattern',
] as const;

export const VALID_MINHAG_SCOPES: readonly Minhag[] = [
  'all',
  'ashkenazi',
  'sephardi',
  'custom',
] as const;

export const VALID_PRIORITIES: readonly ReminderSeverity[] = ['info', 'important'] as const;

export function ruleReferenceFor(rule: BuiltInReminderRule): string {
  if (rule.triggerType === 'special_calendar_pattern' && rule.patternId) {
    return rule.patternId;
  }
  if (rule.triggerType === 'relative_to_zman' && rule.zmanAnchor) {
    return `zman:${rule.zmanAnchor}`;
  }
  return rule.id;
}

export function contentRecordFromRule(
  rule: BuiltInReminderRule,
  contentVersion: string,
): ReminderContentRecord {
  return {
    id: rule.id,
    enabled: rule.enabledByDefault,
    category: rule.category,
    title_he: rule.title,
    body_he: rule.message,
    short_label_he: rule.title,
    default_lead_minutes:
      typeof rule.offsetMinutes === 'number' ? rule.offsetMinutes : null,
    priority: rule.severity ?? 'info',
    minhag_scope: rule.minhag,
    rule_type: rule.triggerType,
    rule_reference: ruleReferenceFor(rule),
    source: 'built_in',
    notes: '',
    content_version: contentVersion,
  };
}

export function buildReminderContentDatabase(
  records: ReminderContentRecord[],
  contentVersion: string,
): ReminderContentDatabase {
  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));
  return {
    schemaVersion: REMINDER_CONTENT_SCHEMA_VERSION,
    contentVersion,
    generatedAt: `content:${contentVersion}`,
    sourceWorkbook: REMINDER_CONTENT_SOURCE_WORKBOOK,
    recordCount: sorted.length,
    records: sorted,
  };
}

export function validateReminderContentAgainstCatalog(
  records: ReminderContentRecord[],
  catalogRules: readonly BuiltInReminderRule[],
  options: { previousRecordCount?: number } = {},
): void {
  if (records.length === 0) {
    throw new Error('Reminder content import produced zero records');
  }

  const catalogById = new Map(catalogRules.map((rule) => [rule.id, rule]));
  const seen = new Set<string>();
  let contentVersion: string | undefined;

  for (const record of records) {
    if (!record.id?.trim()) {
      throw new Error('Reminder content row missing id');
    }
    if (seen.has(record.id)) {
      throw new Error(`Duplicate reminder content id: ${record.id}`);
    }
    seen.add(record.id);

    if (!record.title_he?.trim()) {
      throw new Error(`${record.id}: required Hebrew title (title_he) is missing`);
    }
    if (!record.body_he?.trim()) {
      throw new Error(`${record.id}: required Hebrew body (body_he) is missing`);
    }

    if (!VALID_REMINDER_CATEGORIES.includes(record.category)) {
      throw new Error(`${record.id}: invalid category "${record.category}"`);
    }
    if (!VALID_RULE_TYPES.includes(record.rule_type)) {
      throw new Error(`${record.id}: unsupported rule_type "${record.rule_type}"`);
    }
    if (!VALID_MINHAG_SCOPES.includes(record.minhag_scope)) {
      throw new Error(`${record.id}: invalid minhag_scope "${record.minhag_scope}"`);
    }
    if (!VALID_PRIORITIES.includes(record.priority)) {
      throw new Error(`${record.id}: invalid priority "${record.priority}"`);
    }
    if (
      record.default_lead_minutes !== null &&
      (!Number.isFinite(record.default_lead_minutes) ||
        !Number.isInteger(record.default_lead_minutes))
    ) {
      throw new Error(`${record.id}: invalid default_lead_minutes`);
    }

    if (!record.rule_reference?.trim()) {
      throw new Error(`${record.id}: rule_reference is missing`);
    }

    if (record.rule_type === 'special_calendar_pattern') {
      if (!KNOWN_PATTERN_IDS.has(record.rule_reference)) {
        throw new Error(
          `${record.id}: rule_reference "${record.rule_reference}" does not exist in REMINDER_PATTERNS`,
        );
      }
    } else if (record.rule_type === 'relative_to_zman') {
      if (!/^zman:(candleLighting|sunset|nightfall)$/.test(record.rule_reference)) {
        throw new Error(
          `${record.id}: rule_reference must be zman:candleLighting|sunset|nightfall`,
        );
      }
    } else if (record.rule_reference !== record.id) {
      throw new Error(
        `${record.id}: rule_reference must equal id for rule_type "${record.rule_type}"`,
      );
    }

    const catalogRule = catalogById.get(record.id);
    if (!catalogRule) {
      throw new Error(
        `${record.id}: content id is not present in the TypeScript reminder catalog`,
      );
    }

    if (record.category !== catalogRule.category) {
      throw new Error(
        `${record.id}: category "${record.category}" does not match catalog "${catalogRule.category}" (logic stays in TypeScript)`,
      );
    }
    if (record.rule_type !== catalogRule.triggerType) {
      throw new Error(
        `${record.id}: rule_type "${record.rule_type}" does not match catalog triggerType "${catalogRule.triggerType}"`,
      );
    }
    if (record.rule_reference !== ruleReferenceFor(catalogRule)) {
      throw new Error(
        `${record.id}: rule_reference "${record.rule_reference}" does not match catalog handler "${ruleReferenceFor(catalogRule)}"`,
      );
    }
    if (record.minhag_scope !== catalogRule.minhag) {
      throw new Error(
        `${record.id}: minhag_scope "${record.minhag_scope}" does not match catalog minhag "${catalogRule.minhag}"`,
      );
    }

    // Changing enabled from true→false without notes is treated as accidental disable.
    if (catalogRule.enabledByDefault && !record.enabled && !record.notes.trim()) {
      throw new Error(
        `${record.id}: would silently disable an existing reminder — set notes explaining the intentional disable, or set enabled=TRUE`,
      );
    }

    if (!contentVersion) {
      contentVersion = record.content_version;
    } else if (record.content_version !== contentVersion) {
      throw new Error(
        `${record.id}: inconsistent content_version "${record.content_version}" (expected "${contentVersion}")`,
      );
    }
  }

  for (const rule of catalogRules) {
    if (!seen.has(rule.id)) {
      throw new Error(
        `Catalog reminder "${rule.id}" is missing from the content workbook (record count would drop)`,
      );
    }
  }

  if (records.length !== catalogRules.length) {
    throw new Error(
      `Reminder content count ${records.length} does not match catalog count ${catalogRules.length}`,
    );
  }

  if (
    typeof options.previousRecordCount === 'number' &&
    records.length < options.previousRecordCount
  ) {
    throw new Error(
      `Record count unexpectedly dropped from ${options.previousRecordCount} to ${records.length}`,
    );
  }

  if (!contentVersion?.trim()) {
    throw new Error('content_version is missing on reminder content rows');
  }
}

/**
 * Merge approved Excel-sourced text/config onto catalog rules.
 * Scheduling fields (trigger params, pattern handlers) remain from TypeScript.
 */
export function applyReminderContent(
  catalogRules: readonly BuiltInReminderRule[],
  database: ReminderContentDatabase,
): BuiltInReminderRule[] {
  validateReminderContentAgainstCatalog(database.records, catalogRules, {
    previousRecordCount: database.recordCount,
  });

  if (database.recordCount !== database.records.length) {
    throw new Error(
      `reminder content metadata recordCount (${database.recordCount}) does not match records.length (${database.records.length})`,
    );
  }

  const byId = new Map(database.records.map((record) => [record.id, record]));

  return catalogRules.map((rule) => {
    const content = byId.get(rule.id);
    if (!content) {
      throw new Error(`Missing generated reminder content for catalog id: ${rule.id}`);
    }

    const next: BuiltInReminderRule = {
      ...rule,
      title: content.title_he,
      message: content.body_he,
      enabledByDefault: content.enabled,
      severity: content.priority,
    };

    if (content.default_lead_minutes !== null && rule.triggerType === 'relative_to_zman') {
      next.offsetMinutes = content.default_lead_minutes;
    }

    return next;
  });
}
