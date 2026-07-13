import { HDate } from '@hebcal/core';

import { getBuiltInReminderRules } from '@/src/data/reminders';
import {
  matchesReminderPattern,
  matchesZmanReminderRule,
} from '@/src/data/reminders/patterns';

import { currentAppSettings } from '@/lib/appState';
import { isBuiltInRuleAllowedByCategoryPreferences } from '@/lib/notificationCategoryPrefs';
import {
  applyReminderPlaceholders,
  buildBuiltInPlaceholderValues,
  buildPersonalPlaceholderValues,
  finalizeReminderText,
} from '@/lib/reminderPlaceholders';

import { addDays, toDateKey } from './helpers';
import {
  buildDayCalendarContext,
  hasHolidayKeyword,
  type DayCalendarContext,
} from './dayContext';
import type {
  AppReminder,
  BuiltInReminderRule,
  CustomReminder,
  ReminderCategory,
  ReminderEngineSettings,
} from './types';

function getCatalogRules(): BuiltInReminderRule[] {
  return [...(getBuiltInReminderRules() ?? [])];
}

function matchesMinhag(rule: BuiltInReminderRule, settings: ReminderEngineSettings): boolean {
  if (rule.minhag === 'all') {
    return true;
  }

  if (rule.minhag === 'ashkenazi') {
    return settings.minhag === 'ashkenazi';
  }

  if (rule.minhag === 'sephardi') {
    return settings.minhag === 'sephardi';
  }

  return settings.minhag === 'custom';
}

function isRuleEnabled(rule: BuiltInReminderRule, settings: ReminderEngineSettings): boolean {
  if (rule.israelOnly && !settings.israel) {
    return false;
  }

  if (!settings.enabledReminderCategories.includes(rule.category)) {
    return false;
  }

  if (!isBuiltInRuleAllowedByCategoryPreferences(rule, currentAppSettings)) {
    return false;
  }

  if (settings.disabledBuiltInReminderIds.includes(rule.id)) {
    return false;
  }

  return matchesMinhag(rule, settings);
}

function matchesHebrewDate(rule: BuiltInReminderRule, ctx: DayCalendarContext): boolean {
  if (!rule.hebrewMonth || !rule.hebrewDay) {
    return false;
  }

  return ctx.hdate.getMonthName() === rule.hebrewMonth && ctx.hdate.getDate() === rule.hebrewDay;
}

function matchesHoliday(rule: BuiltInReminderRule, ctx: DayCalendarContext): boolean {
  if (!rule.holidayKeywords?.length) {
    return false;
  }

  return hasHolidayKeyword(ctx.events, rule.holidayKeywords);
}

function matchesRelativeHoliday(rule: BuiltInReminderRule, ctx: DayCalendarContext): boolean {
  if (!rule.holidayKeywords?.length || rule.offsetDays === undefined) {
    return false;
  }

  const target = addDays(ctx.date, -rule.offsetDays);
  return hasHolidayKeyword(
    buildDayCalendarContext(target, ctx.israel).events,
    rule.holidayKeywords,
  );
}

function matchesWeekday(rule: BuiltInReminderRule, ctx: DayCalendarContext): boolean {
  if (rule.weekday === undefined) {
    return false;
  }

  return ctx.weekday === rule.weekday;
}

function ruleMatches(
  rule: BuiltInReminderRule,
  ctx: DayCalendarContext,
  settings: ReminderEngineSettings,
): boolean {
  if (rule.requiresHavdalahMethod && rule.requiresHavdalahMethod !== settings.havdalahMethod) {
    return false;
  }

  switch (rule.triggerType) {
    case 'hebrew_date':
      return matchesHebrewDate(rule, ctx);
    case 'holiday': {
      if (!matchesHoliday(rule, ctx)) {
        return false;
      }
      if (rule.id === 'chanukah_daily') {
        return !ctx.events.some((event) => event.isChanukah && event.chanukahDay === 1);
      }
      if (rule.id === 'yom_kippur_fast_begins') {
        return hasHolidayKeyword(ctx.tomorrowEvents, rule.holidayKeywords ?? []);
      }
      return true;
    }
    case 'relative_to_holiday':
      return matchesRelativeHoliday(rule, ctx);
    case 'weekday':
      return matchesWeekday(rule, ctx);
    case 'relative_to_zman':
      return matchesZmanReminderRule(rule, ctx, settings);
    case 'special_calendar_pattern':
      return matchesReminderPattern(rule, ctx, settings);
    default:
      return false;
  }
}

function toAppReminder(rule: BuiltInReminderRule, ctx: DayCalendarContext): AppReminder {
  const placeholders = buildBuiltInPlaceholderValues(rule, ctx, currentAppSettings.city);

  return {
    id: `${toDateKey(ctx.date)}-${rule.id}`,
    date: toDateKey(ctx.date),
    hebrewDate: ctx.hebrewDate,
    gregorianDate: ctx.gregorianDate,
    dayOfWeek: ctx.dayOfWeek,
    title: finalizeReminderText(rule.title, placeholders),
    message: finalizeReminderText(rule.message, placeholders),
    category: rule.category,
    severity: rule.severity ?? 'info',
    source: 'built_in',
    ruleId: rule.id,
  };
}

export function evaluateBuiltInRules(
  ctx: DayCalendarContext,
  settings: ReminderEngineSettings,
): AppReminder[] {
  const results: AppReminder[] = [];
  const seen = new Set<string>();

  for (const rule of getCatalogRules()) {
    if (!isRuleEnabled(rule, settings)) {
      continue;
    }

    if (!ruleMatches(rule, ctx, settings)) {
      continue;
    }

    const key = `${toDateKey(ctx.date)}-${rule.id}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(toAppReminder(rule, ctx));
  }

  return results;
}

function customMatchesToday(reminder: CustomReminder, ctx: DayCalendarContext): boolean {
  return (
    ctx.hdate.getMonthName() === reminder.hebrewMonth &&
    ctx.hdate.getDate() === reminder.hebrewDay
  );
}

function getCustomReminderCategory(reminder: CustomReminder): ReminderCategory {
  return reminder.category === 'minhag_segulah' ? 'minhag_segulah' : 'personal';
}

export function evaluateCustomReminders(
  customReminders: CustomReminder[],
  ctx: DayCalendarContext,
  settings: ReminderEngineSettings,
): AppReminder[] {
  return customReminders
    .filter((reminder) => {
      if (!reminder.enabled) {
        return false;
      }

      const category = getCustomReminderCategory(reminder);
      if (!settings.enabledReminderCategories.includes(category)) {
        return false;
      }

      return customMatchesToday(reminder, ctx);
    })
    .map((reminder) => {
      const placeholders = buildPersonalPlaceholderValues(reminder.title);
      const message =
        reminder.message.trim() ||
        applyReminderPlaceholders('כדאי לזכור: {name}', placeholders);
      const category = getCustomReminderCategory(reminder);

      return {
        id: `${toDateKey(ctx.date)}-personal-${reminder.id}`,
        date: toDateKey(ctx.date),
        hebrewDate: ctx.hebrewDate,
        gregorianDate: ctx.gregorianDate,
        dayOfWeek: ctx.dayOfWeek,
        title: finalizeReminderText(reminder.title, placeholders),
        message: finalizeReminderText(message, placeholders),
        category,
        severity: 'info' as const,
        source: 'personal' as const,
        ruleId: reminder.id,
      };
    });
}

/** @deprecated Use evaluateCustomReminders */
export const evaluatePersonalReminders = evaluateCustomReminders;

export function getAppRemindersForDay(
  date: Date,
  settings: ReminderEngineSettings,
  customReminders: CustomReminder[] = [],
): AppReminder[] {
  const ctx = buildDayCalendarContext(date, settings.israel);
  const combined = [
    ...evaluateBuiltInRules(ctx, settings),
    ...evaluateCustomReminders(customReminders, ctx, settings),
  ];
  const seen = new Set<string>();

  return combined.filter((reminder) => {
    const key = `${reminder.date}-${reminder.ruleId ?? reminder.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
