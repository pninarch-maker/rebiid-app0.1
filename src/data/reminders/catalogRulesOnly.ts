/**
 * Raw built-in reminder catalog (TypeScript scheduling authority).
 * Content overlay is applied in `./index.ts` — do not import this from app UI.
 */
import { validateReminderCatalog } from './createRule';
import { chanukahPurimReminderRules } from './catalog/chanukahPurim';
import {
  elulAndTishreiReminderRules,
  sukkotAndWinterReminderRules,
  yomKippurReminderRules,
} from './catalog/elulTishrei';
import { mourningSeasonReminderRules } from './catalog/mourningFasts';
import { omerShavuotReminderRules, pesachReminderRules } from './catalog/pesachOmer';
import { roshChodeshReminderRules } from './catalog/roshChodesh';
import { shabbatReminderRules } from './catalog/shabbat';
import { specialEventsReminderRules } from './catalog/specialEvents';
import { minhagSegulahReminderRules } from './catalog/minhagSegulah';

export const CATALOG_REMINDER_RULES = [
  ...shabbatReminderRules,
  ...roshChodeshReminderRules,
  ...elulAndTishreiReminderRules,
  ...yomKippurReminderRules,
  ...sukkotAndWinterReminderRules,
  ...chanukahPurimReminderRules,
  ...pesachReminderRules,
  ...omerShavuotReminderRules,
  ...mourningSeasonReminderRules,
  ...specialEventsReminderRules,
  ...minhagSegulahReminderRules,
];

validateReminderCatalog(CATALOG_REMINDER_RULES);
