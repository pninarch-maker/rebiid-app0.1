import type { JewishDayZmanim } from '@/src/engine/zmanim/types';

import { ZmanimCopy } from '@/lib/rebiidCopy';

export interface ZmanimDisplayRow {
  label: string;
  time: string;
}

/** Title for any zmanim section, including the selected city from Settings. */
export function getZmanimDisplayTitle(city?: string | null): string {
  const trimmed = city?.trim();
  if (!trimmed) {
    return `${ZmanimCopy.baseTitle} — ${ZmanimCopy.noCity}`;
  }
  if (trimmed === 'ירושלים') {
    return `${ZmanimCopy.baseTitle} — ${trimmed}`;
  }
  return `${ZmanimCopy.baseTitle} ב${trimmed}`;
}

export function getCityFromZmanimSettingsKey(settingsKey: string): string {
  return settingsKey.split('|')[0]?.trim() ?? '';
}

/** Sunday (א׳) → Shabbat (ש׳) engine column order — see `calendarWeekLayout.ts` for display rules. */
export {
  CALENDAR_ENGINE_WEEKDAY_HEADERS,
  CALENDAR_WEEKDAY_HEADERS,
} from './calendarWeekLayout';

const ZMANIM_DISPLAY_ORDER: { key: keyof JewishDayZmanim; label: string }[] = [
  { key: 'alotHashachar', label: 'עלות השחר' },
  { key: 'sunrise', label: 'הנץ החמה' },
  { key: 'sofZmanShma', label: 'סוף זמן קריאת שמע' },
  { key: 'sofZmanTfilla', label: 'סוף זמן תפילה' },
  { key: 'chatzot', label: 'חצות' },
  { key: 'minchaGedola', label: 'מנחה גדולה' },
  { key: 'minchaKetana', label: 'מנחה קטנה' },
  { key: 'plagHaMincha', label: 'פלג המנחה' },
  { key: 'sunset', label: 'שקיעה' },
  { key: 'candleLighting', label: 'הדלקת נרות' },
  { key: 'havdalah', label: 'הבדלה' },
  { key: 'motzeiShabbat', label: 'מוצאי שבת' },
  { key: 'tzeit', label: 'צאת הכוכבים' },
];

export function getZmanimDisplayRows(zmanim: JewishDayZmanim): ZmanimDisplayRow[] {
  const rows: ZmanimDisplayRow[] = [];
  const usedLabels = new Set<string>();

  for (const item of ZMANIM_DISPLAY_ORDER) {
    const time = zmanim[item.key];
    if (!time || usedLabels.has(item.label)) {
      continue;
    }

    if (item.key === 'tzeit' && (zmanim.havdalah || zmanim.motzeiShabbat)) {
      continue;
    }

    if (item.key === 'motzeiShabbat' && zmanim.havdalah) {
      continue;
    }

    rows.push({ label: item.label, time });
    usedLabels.add(item.label);
  }

  return rows;
}

const HOME_KEY_ZMANIM: { key: keyof JewishDayZmanim; label: string }[] = [
  { key: 'sunrise', label: 'זריחה' },
  { key: 'chatzot', label: 'חצות' },
  { key: 'sunset', label: 'שקיעה' },
  { key: 'tzeit', label: 'צאת הכוכבים' },
];

/** Compact zmanim rows for the Home bento card. */
export function getHomeKeyZmanimDisplayRows(zmanim: JewishDayZmanim): ZmanimDisplayRow[] {
  const rows: ZmanimDisplayRow[] = [];

  for (const item of HOME_KEY_ZMANIM) {
    let time = zmanim[item.key];

    if (item.key === 'tzeit' && !time) {
      time = zmanim.havdalah ?? zmanim.motzeiShabbat;
    }

    if (time) {
      rows.push({ label: item.label, time });
    }
  }

  return rows;
}
