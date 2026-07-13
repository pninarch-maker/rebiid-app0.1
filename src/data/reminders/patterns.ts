import { HDate } from '@hebcal/core';

import { isBirkatHaChamaEve, isBirkatHaChamaGregorianDate } from './birkatHaChamaDates';
import { isErevRoshChodeshSivan, isYomKippurKatanDay } from './yomKippurKatan';
import { isTaanitBechorotDay, isTaanitBechorotEve } from './taanitBechorot';

import { addDays } from '@/src/engine/reminders/helpers';
import { daysUntilHebrewDate, hasHolidayKeyword, isChanukahDay, isOmerDay, isRoshChodeshDay, type DayCalendarContext } from '@/src/engine/reminders/dayContext';
import type { BuiltInReminderRule, ReminderEngineSettings } from '@/src/engine/reminders/types';

export const REMINDER_PATTERNS = {
  roshChodeshToday: 'rosh_chodesh_today',
  roshChodeshTomorrow: 'rosh_chodesh_tomorrow',
  omerDaily: 'omer_daily',
  omerFirstNight: 'omer_first_night',
  chanukahFirstNight: 'chanukah_first_night',
  chanukahFriday: 'chanukah_friday',
  chanukahMotzeiShabbat: 'chanukah_motzei_shabbat',
  eruvTavshilin: 'eruv_tavshilin',
  prepareExistingFlame: 'prepare_existing_flame',
  roshChodeshIyarFriday: 'rosh_chodesh_iyar_friday',
  ashkenaziSelichot: 'ashkenazi_selichot',
  tishaBavPostponed: 'tisha_bav_postponed',
  yomTovShabbatFollows: 'yom_tov_shabbat_follows',
  birkatHaChamaEve: 'birkat_hachama_eve',
  birkatHaChamaDay: 'birkat_hachama_day',
  taanitBechorotDay: 'taanit_bechorot_day',
  taanitBechorotEve: 'taanit_bechorot_eve',
  erevRoshChodeshSivan: 'erev_rosh_chodesh_sivan',
  yomKippurKatan: 'yom_kippur_katan',
} as const;

export type ReminderPatternId = (typeof REMINDER_PATTERNS)[keyof typeof REMINDER_PATTERNS];

function isYomTovShabbatSequence(ctx: DayCalendarContext): boolean {
  const dayAfterTomorrow = addDays(ctx.date, 2);
  const tomorrowIsMajorYomTov = hasHolidayKeyword(ctx.tomorrowEvents, [
    'Pesach',
    'Sukkot',
    'Shavuot',
  ]);
  const tomorrowIsErevYomTov = hasHolidayKeyword(ctx.tomorrowEvents, [
    'Erev Pesach',
    'Erev Sukkot',
    'Erev Shavuot',
  ]);
  const shabbatFollows = dayAfterTomorrow.getDay() === 6;
  return shabbatFollows && (tomorrowIsMajorYomTov || tomorrowIsErevYomTov);
}

export function matchesReminderPattern(
  rule: BuiltInReminderRule,
  ctx: DayCalendarContext,
  settings: ReminderEngineSettings,
): boolean {
  void settings;

  switch (rule.patternId) {
    case REMINDER_PATTERNS.roshChodeshToday:
      return isRoshChodeshDay(ctx.events);
    case REMINDER_PATTERNS.roshChodeshTomorrow:
      return isRoshChodeshDay(ctx.tomorrowEvents);
    case REMINDER_PATTERNS.omerDaily:
      return isOmerDay(ctx.events);
    case REMINDER_PATTERNS.omerFirstNight:
      return ctx.events.some((event) => event.isOmer && event.omerDay === 1);
    case REMINDER_PATTERNS.chanukahFirstNight:
      return hasHolidayKeyword(ctx.tomorrowEvents, ['Chanukah: 1 Candle']);
    case REMINDER_PATTERNS.chanukahFriday:
      return ctx.isFriday && isChanukahDay(ctx.events);
    case REMINDER_PATTERNS.chanukahMotzeiShabbat:
      return ctx.isSaturday && isChanukahDay(ctx.events);
    case REMINDER_PATTERNS.eruvTavshilin:
      return isYomTovShabbatSequence(ctx);
    case REMINDER_PATTERNS.prepareExistingFlame: {
      const dayAfterTomorrow = addDays(ctx.date, 2);
      const tomorrowIsMajorYomTov = hasHolidayKeyword(ctx.tomorrowEvents, [
        'Pesach',
        'Sukkot',
        'Shavuot',
      ]);
      return dayAfterTomorrow.getDay() === 6 && tomorrowIsMajorYomTov;
    }
    case REMINDER_PATTERNS.yomTovShabbatFollows:
      return isYomTovShabbatSequence(ctx);
    case REMINDER_PATTERNS.roshChodeshIyarFriday:
      return (
        ctx.isFriday &&
        isRoshChodeshDay(ctx.tomorrowEvents) &&
        ctx.tomorrow.getMonthName() === 'Iyyar' &&
        ctx.tomorrow.getDate() === 1
      );
    case REMINDER_PATTERNS.ashkenaziSelichot: {
      if (!ctx.isSaturday) {
        return false;
      }
      const days = daysUntilHebrewDate(ctx.hdate, 'Tishrei', 1);
      return [4, 5, 6, 7, 11, 12, 13].includes(days);
    }
    case REMINDER_PATTERNS.tishaBavPostponed: {
      const ninthAv = new HDate(9, 'Av', ctx.hdate.getFullYear());
      if (ninthAv.getDay() !== 6) {
        return false;
      }
      const observedFast = new HDate(10, 'Av', ctx.hdate.getFullYear());
      return ctx.hdate.abs() === observedFast.abs();
    }
    case REMINDER_PATTERNS.birkatHaChamaEve:
      return isBirkatHaChamaEve(ctx.date);
    case REMINDER_PATTERNS.birkatHaChamaDay:
      return isBirkatHaChamaGregorianDate(ctx.date);
    case REMINDER_PATTERNS.taanitBechorotDay:
      return isTaanitBechorotDay(ctx.hdate);
    case REMINDER_PATTERNS.taanitBechorotEve:
      return isTaanitBechorotEve(ctx.hdate);
    case REMINDER_PATTERNS.erevRoshChodeshSivan:
      return isErevRoshChodeshSivan(ctx.tomorrow);
    case REMINDER_PATTERNS.yomKippurKatan:
      return isYomKippurKatanDay(ctx.hdate, ctx.tomorrow);
    default:
      return false;
  }
}

export function matchesZmanReminderRule(
  rule: BuiltInReminderRule,
  ctx: DayCalendarContext,
  settings: ReminderEngineSettings,
): boolean {
  if (rule.requiresHavdalahMethod && rule.requiresHavdalahMethod !== settings.havdalahMethod) {
    return false;
  }

  switch (rule.zmanAnchor) {
    case 'candleLighting':
      return ctx.isFriday && Boolean(ctx.zmanim.candleLighting);
    case 'sunset':
      if (rule.id === 'pesach_chametz_midday') {
        return ctx.hdate.getMonthName() === 'Nisan' && ctx.hdate.getDate() === 14;
      }
      return ctx.isFriday && Boolean(ctx.zmanim.sunset);
    case 'nightfall':
      if (!ctx.isSaturday || !ctx.zmanim.nightfall) {
        return false;
      }
      if (rule.requiresHavdalahMethod) {
        return settings.havdalahMethod === rule.requiresHavdalahMethod;
      }
      return true;
    default:
      return false;
  }
}
