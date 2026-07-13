import { Locale } from '@hebcal/core';
import type { HDate } from '@hebcal/core';

import type { BuiltInReminderRule } from '@/src/engine/reminders/types';
import type { DayCalendarContext } from '@/src/engine/reminders/dayContext';

const HEBREW_LOCALE = 'he-x-NoNikud';

const PLACEHOLDER_FALLBACKS = {
  city: 'העיר שלך',
  time: 'לפי הזמנים באפליקציה',
  monthName: 'החודש',
  name: 'שם התזכורת',
} as const;

export interface ReminderPlaceholderValues {
  city?: string;
  time?: string;
  monthName?: string;
  name?: string;
}

export function formatHebrewMonthName(hdate: HDate): string {
  return Locale.gettext(hdate.getMonthName(), HEBREW_LOCALE);
}

function getTimeForRule(rule: BuiltInReminderRule, ctx: DayCalendarContext): string | undefined {
  if (rule.zmanAnchor === 'candleLighting' || rule.id === 'shabbat_approaching' || rule.id === 'candle_lighting') {
    return ctx.zmanim.candleLighting;
  }

  if (rule.zmanAnchor === 'sunset' || rule.id === 'shabbat_begins') {
    return ctx.zmanim.sunset;
  }

  if (rule.zmanAnchor === 'nightfall' || rule.id === 'havdalah_regular' || rule.id === 'havdalah_rabbeinu_tam') {
    return ctx.zmanim.nightfall;
  }

  return undefined;
}

function getMonthNameForRule(
  rule: BuiltInReminderRule,
  ctx: DayCalendarContext,
): string | undefined {
  if (rule.id === 'rosh_chodesh_tomorrow' || rule.patternId === 'rosh_chodesh_tomorrow') {
    return formatHebrewMonthName(ctx.tomorrow);
  }

  if (
    rule.id === 'rosh_chodesh_today' ||
    rule.patternId === 'rosh_chodesh_today' ||
    rule.id === 'yaaleh_veyavo'
  ) {
    return formatHebrewMonthName(ctx.hdate);
  }

  return undefined;
}

export function buildBuiltInPlaceholderValues(
  rule: BuiltInReminderRule,
  ctx: DayCalendarContext,
  city: string,
): ReminderPlaceholderValues {
  return {
    city: city.trim() || PLACEHOLDER_FALLBACKS.city,
    time: getTimeForRule(rule, ctx),
    monthName: getMonthNameForRule(rule, ctx),
  };
}

export function buildPersonalPlaceholderValues(name: string): ReminderPlaceholderValues {
  const trimmed = name.trim();
  return { name: trimmed || PLACEHOLDER_FALLBACKS.name };
}

function resolvePlaceholder(
  key: keyof typeof PLACEHOLDER_FALLBACKS,
  value: string | undefined,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : PLACEHOLDER_FALLBACKS[key];
}

export function applyReminderPlaceholders(
  text: string,
  values: ReminderPlaceholderValues,
): string {
  let result = text
    .replace(/\{city\}/g, resolvePlaceholder('city', values.city))
    .replace(/\{time\}/g, resolvePlaceholder('time', values.time))
    .replace(/\{monthName\}/g, resolvePlaceholder('monthName', values.monthName))
    .replace(/\{name\}/g, resolvePlaceholder('name', values.name));

  result = result
    .replace(/\{[^}]+\}/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();

  return result;
}

export function finalizeReminderText(
  text: string,
  values: ReminderPlaceholderValues,
): string {
  if (!text.includes('{')) {
    return text;
  }

  return applyReminderPlaceholders(text, values);
}
