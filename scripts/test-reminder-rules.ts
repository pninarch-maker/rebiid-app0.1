/**
 * Built-in reminder catalog and trigger checks.
 * Run: npm run test:reminders
 */
import {
  BUILT_IN_REMINDER_RULES,
  validateReminderCatalog,
} from '../src/data/reminders';
import { getDefaultReminderEngineSettings } from '../src/engine/reminders/defaultSettings';
import { getAppRemindersForDay } from '../src/engine/reminders/ruleEngine';

const testSettings = {
  ...getDefaultReminderEngineSettings(true),
  disabledBuiltInReminderIds: [] as string[],
};

function assertRuleOnDate(
  label: string,
  date: string,
  ruleId: string,
  minhag: 'ashkenazi' | 'sephardi' | 'custom' = 'ashkenazi',
): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, { ...testSettings, minhag }, []);
  const found = result.some((reminder) => reminder.ruleId === ruleId);

  if (!found) {
    const ids = result.map((reminder) => reminder.ruleId).join(', ') || '(none)';
    throw new Error(`${label}: expected ${ruleId} on ${date}, got [${ids}]`);
  }

  console.log(`✓ ${label}`);
}

function assertNoRuleOnDate(
  label: string,
  date: string,
  ruleId: string,
  minhag: 'ashkenazi' | 'sephardi' | 'custom' = 'ashkenazi',
): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, { ...testSettings, minhag }, []);
  const found = result.some((reminder) => reminder.ruleId === ruleId);

  if (found) {
    throw new Error(`${label}: did not expect ${ruleId} on ${date}`);
  }

  console.log(`✓ ${label}`);
}

validateReminderCatalog(BUILT_IN_REMINDER_RULES);
console.log(`Built-in rules: ${BUILT_IN_REMINDER_RULES.length}`);

assertRuleOnDate('Friday candle lighting', '2026-01-16', 'candle_lighting');
assertRuleOnDate('Shabbat begins Friday', '2026-01-16', 'shabbat_begins');
assertRuleOnDate('Rosh Chodesh today', '2025-01-01', 'rosh_chodesh_today');
assertRuleOnDate('Hallel Rosh Chodesh', '2025-01-01', 'hallel_rosh_chodesh');
assertRuleOnDate('Eruv Tavshilin', '2025-04-17', 'eruv_tavshilin');
assertRuleOnDate('Elul begins', '2025-08-25', 'elul_begins');
assertRuleOnDate('Ashkenazi shofar Elul', '2025-08-25', 'ashkenazi_shofar');
assertRuleOnDate('Sephardi selichot Elul', '2025-08-25', 'elul_sephardi_selichot', 'sephardi');
assertRuleOnDate('First Chanukah night eve', '2025-12-13', 'chanukah_first_night');
assertRuleOnDate('Chanukah on Friday', '2025-12-19', 'chanukah_friday');
assertRuleOnDate('Purim mishloach', '2025-03-13', 'purim_mishloach_manot');
assertRuleOnDate('Bedikat Chametz eve', '2025-04-12', 'bedikat_chametz');
assertRuleOnDate('Pesach halachic midday', '2025-04-12', 'pesach_halachic_midday');
assertRuleOnDate('First Omer night eve', '2025-04-14', 'omer_first_night');
assertRuleOnDate('Rosh Chodesh Iyar on Friday', '2026-04-17', 'haircut_rosh_chodesh_iyar_friday', 'custom');
assertRuleOnDate('Reminder before 17 Tammuz', '2025-07-12', 'seventeenth_tammuz');
assertRuleOnDate('Nine days begin', '2025-07-26', 'nine_days_begin');
assertRuleOnDate('Postponed Tisha BAv', '2029-07-22', 'tisha_bav_postponed');
assertRuleOnDate('Yom Kippur memorial candle', '2025-10-01', 'yom_kippur_memorial_candle', 'custom');
assertRuleOnDate('Birkat hailanot', '2025-03-30', 'birkat_hailanot');
assertRuleOnDate('Tu Bishvat', '2026-02-02', 'tu_bishvat');
assertRuleOnDate('Shabbat Zachor', '2025-03-08', 'shabbat_zachor');

assertRuleOnDate('Birkat HaChama eve 2037', '2037-04-07', 'birkat_hachama_eve');
assertRuleOnDate('Birkat HaChama day 2037', '2037-04-08', 'birkat_hachama_day');
assertRuleOnDate('Birkat HaChama eve 2065', '2065-04-07', 'birkat_hachama_eve');
assertRuleOnDate('Birkat HaChama day 2065', '2065-04-08', 'birkat_hachama_day');
assertRuleOnDate('Birkat HaChama eve 2093', '2093-04-07', 'birkat_hachama_eve');
assertRuleOnDate('Birkat HaChama day 2093', '2093-04-08', 'birkat_hachama_day');
assertNoRuleOnDate('No Birkat HaChama nearby 2037', '2037-04-06', 'birkat_hachama_day');
assertNoRuleOnDate('No Birkat HaChama nearby 2037 eve', '2037-04-06', 'birkat_hachama_eve');
assertNoRuleOnDate('No Birkat HaChama day before eve 2037', '2037-04-07', 'birkat_hachama_day');
assertNoRuleOnDate('No Birkat HaChama eve on event day 2037', '2037-04-08', 'birkat_hachama_eve');

assertRuleOnDate('Taanit Bechorot regular Erev Pesach', '2024-04-22', 'taanit_bechorot');
assertRuleOnDate('Taanit Bechorot eve regular', '2024-04-21', 'taanit_bechorot_eve');
assertRuleOnDate('Taanit Bechorot when Erev Pesach is Shabbat', '2025-04-10', 'taanit_bechorot');
assertRuleOnDate('Taanit Bechorot eve when Erev Pesach is Shabbat', '2025-04-09', 'taanit_bechorot_eve');
assertNoRuleOnDate('No Taanit Bechorot on Shabbat Erev Pesach', '2025-04-12', 'taanit_bechorot');

assertRuleOnDate('Erev Rosh Hashanah fast when enabled', '2025-09-22', 'erev_rosh_hashanah_fast');
assertRuleOnDate('Erev Rosh Hashanah fast eve when enabled', '2025-09-21', 'erev_rosh_hashanah_fast_eve');
assertRuleOnDate('Erev Rosh Hashanah general reminder still fires', '2025-09-22', 'erev_rosh_hashanah');

function assertNoRuleOnDateWithSettings(
  label: string,
  date: string,
  ruleId: string,
  settings: typeof testSettings,
): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, settings, []);
  const found = result.some((reminder) => reminder.ruleId === ruleId);

  if (found) {
    throw new Error(`${label}: did not expect ${ruleId} on ${date}`);
  }

  console.log(`✓ ${label}`);
}

assertNoRuleOnDateWithSettings(
  'Erev Rosh Hashanah fast off with default settings',
  '2025-09-22',
  'erev_rosh_hashanah_fast',
  getDefaultReminderEngineSettings(true),
);

const minhagEnabledSettings = {
  ...getDefaultReminderEngineSettings(true),
  enabledReminderCategories: [
    ...getDefaultReminderEngineSettings(true).enabledReminderCategories,
    'minhag_segulah' as const,
  ],
  disabledBuiltInReminderIds: [] as string[],
};

assertNoRuleOnDateWithSettings(
  'Tfilat HaShelah hidden when minhag category disabled',
  '2025-05-27',
  'tfilat_hashelah',
  testSettings,
);
assertNoRuleOnDateWithSettings(
  'Yom Kippur Katan hidden when minhag category disabled',
  '2025-04-28',
  'yom_kippur_katan',
  testSettings,
);

function assertRuleOnDateWithSettings(
  label: string,
  date: string,
  ruleId: string,
  settings: typeof testSettings,
): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, settings, []);
  const found = result.some((reminder) => reminder.ruleId === ruleId);

  if (!found) {
    const ids = result.map((reminder) => reminder.ruleId).join(', ') || '(none)';
    throw new Error(`${label}: expected ${ruleId} on ${date}, got [${ids}]`);
  }

  console.log(`✓ ${label}`);
}

assertRuleOnDateWithSettings(
  'Tfilat HaShelah on erev Rosh Chodesh Sivan when enabled',
  '2025-05-27',
  'tfilat_hashelah',
  minhagEnabledSettings,
);
assertRuleOnDateWithSettings(
  'Yom Kippur Katan on regular erev Rosh Chodesh when enabled',
  '2025-04-28',
  'yom_kippur_katan',
  minhagEnabledSettings,
);
assertNoRuleOnDateWithSettings(
  'No Yom Kippur Katan on omitted erev Rosh Chodesh Cheshvan',
  '2025-10-22',
  'yom_kippur_katan',
  minhagEnabledSettings,
);

const minhagCustomReminder = {
  id: 'test-minhag-custom',
  title: 'יארצייט משפחתי',
  message: 'יום אזכרה משפחתי.',
  hebrewMonth: 'Nisan',
  hebrewDay: 15,
  time: '09:00',
  enabled: true,
  reminderOffsetMinutes: -1,
  category: 'minhag_segulah' as const,
};

function assertCustomReminderOnDate(
  label: string,
  date: string,
  customId: string,
  settings: typeof testSettings,
  customReminders: typeof minhagCustomReminder[],
): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, settings, customReminders);
  const found = result.some((reminder) => reminder.ruleId === customId);

  if (!found) {
    throw new Error(`${label}: expected custom reminder ${customId} on ${date}`);
  }

  console.log(`✓ ${label}`);
}

function assertNoCustomReminderOnDate(
  label: string,
  date: string,
  customId: string,
  settings: typeof testSettings,
  customReminders: typeof minhagCustomReminder[],
): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, settings, customReminders);
  const found = result.some((reminder) => reminder.ruleId === customId);

  if (found) {
    throw new Error(`${label}: did not expect custom reminder ${customId} on ${date}`);
  }

  console.log(`✓ ${label}`);
}

assertCustomReminderOnDate(
  'Minhag custom reminder fires when category enabled',
  '2025-04-13',
  'test-minhag-custom',
  minhagEnabledSettings,
  [minhagCustomReminder],
);
assertNoCustomReminderOnDate(
  'Minhag custom reminder hidden when category disabled',
  '2025-04-13',
  'test-minhag-custom',
  testSettings,
  [minhagCustomReminder],
);

function assertNoDuplicateRules(label: string, date: string): void {
  const day = new Date(`${date}T12:00:00`);
  const result = getAppRemindersForDay(day, testSettings, []);
  const ruleIds = result.map((reminder) => reminder.ruleId).filter(Boolean) as string[];
  const unique = new Set(ruleIds);

  if (unique.size !== ruleIds.length) {
    throw new Error(`${label}: duplicate rule ids on ${date}: ${ruleIds.join(', ')}`);
  }

  console.log(`✓ ${label}`);
}

assertNoDuplicateRules('No duplicate reminders on Birkat HaChama eve 2037', '2037-04-07');
assertNoDuplicateRules('No duplicate reminders on Birkat HaChama day 2037', '2037-04-08');
assertNoDuplicateRules('No duplicate reminders on Taanit Bechorot 2024', '2024-04-22');
assertNoDuplicateRules('No duplicate reminders on Erev Rosh Hashanah 2025', '2025-09-22');

assertNoRuleOnDate('Ashkenazi selichot hidden for Sephardi', '2026-09-05', 'elul_ashkenazi_selichot', 'sephardi');
assertNoRuleOnDate('Ashkenazi shofar hidden for Sephardi', '2025-08-25', 'ashkenazi_shofar', 'sephardi');
assertNoRuleOnDate('Sephardi selichot hidden for Ashkenazi', '2025-08-25', 'elul_sephardi_selichot', 'ashkenazi');

const discouragedPhrases = ['בדוק לפי', 'לפי המנהג', 'consult your rabbi', 'שאל את הרב'];
for (const rule of BUILT_IN_REMINDER_RULES) {
  if (discouragedPhrases.some((phrase) => rule.message.includes(phrase))) {
    throw new Error(`${rule.id}: message uses discouraged phrasing`);
  }
}

console.log('All reminder rule checks passed.');
