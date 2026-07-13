import type { Reminder } from './Reminder';

export type { JewishDayZmanim } from '@/src/engine/zmanim/types';

import type { JewishDayZmanim } from '@/src/engine/zmanim/types';

export interface JewishDay {
  hebrewDate: string;
  gregorianDate: string;
  dayOfWeek: string;
  parasha?: string;
  holidays: string[];
  zmanim: JewishDayZmanim;
  reminders: Reminder[];
}

export type ReminderInputDay = Omit<JewishDay, 'reminders'>;

export interface EngineConfig {
  /** Use the Israeli holiday and parasha schedule. Defaults to true. */
  israel: boolean;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  israel: true,
};
