import type { Location } from '@hebcal/core';
import { Zmanim } from '@hebcal/core';

import type { HavdalahMethod } from '@/lib/settingsTypes';

import { formatZmanTime } from './formatTime';
import type { JewishDayZmanim, ZmanimCalculationProfile } from './types';

interface TimedZmanEvents {
  candleLighting?: string;
  havdalah?: string;
}

function assignZman(
  result: JewishDayZmanim,
  key: keyof JewishDayZmanim,
  time: Date | null | undefined,
  location: Location,
): void {
  if (!time) {
    return;
  }

  const formatted = formatZmanTime(time, location);
  if (formatted) {
    result[key] = formatted;
  }
}

export function calculateHalachicZmanim(
  zmanim: Zmanim,
  location: Location,
  profile: ZmanimCalculationProfile,
  timedEvents: TimedZmanEvents,
  havdalahMethod: HavdalahMethod,
  weekday: number,
): JewishDayZmanim {
  const result: JewishDayZmanim = {};

  assignZman(result, 'alotHashachar', zmanim.alotHaShachar(), location);
  assignZman(result, 'sunrise', zmanim.sunrise(), location);

  if (profile === 'magen_avraham') {
    assignZman(result, 'sofZmanShma', zmanim.sofZmanShmaMGA(), location);
    assignZman(result, 'sofZmanTfilla', zmanim.sofZmanTfillaMGA(), location);
    assignZman(result, 'minchaGedola', zmanim.minchaGedolaMGA(), location);
    assignZman(result, 'minchaKetana', zmanim.minchaKetanaMGA(), location);
  } else {
    assignZman(result, 'sofZmanShma', zmanim.sofZmanShma(), location);
    assignZman(result, 'sofZmanTfilla', zmanim.sofZmanTfilla(), location);
    assignZman(result, 'minchaGedola', zmanim.minchaGedola(), location);
    assignZman(result, 'minchaKetana', zmanim.minchaKetana(), location);
  }

  assignZman(result, 'chatzot', zmanim.chatzot(), location);
  assignZman(result, 'plagHaMincha', zmanim.plagHaMincha(), location);
  assignZman(result, 'sunset', zmanim.sunset(), location);

  // tzeit (צאת הכוכבים) is always the canonical halachic value — never aliased to havdalah.
  assignZman(result, 'tzeit', zmanim.tzeit(), location);
  if (result.tzeit) {
    result.nightfall = result.tzeit;
  }

  if (timedEvents.candleLighting) {
    result.candleLighting = timedEvents.candleLighting;
  }

  if (timedEvents.havdalah) {
    result.havdalah = timedEvents.havdalah;
    result.nightfall = timedEvents.havdalah;
    if (weekday === 6) {
      result.motzeiShabbat = timedEvents.havdalah;
    }
  } else if (weekday === 6 && havdalahMethod === 'rabbeinu_tam') {
    assignZman(result, 'motzeiShabbat', zmanim.sunsetOffset(72, false), location);
    if (result.motzeiShabbat) {
      result.nightfall = result.motzeiShabbat;
    }
  } else if (weekday === 6 && result.tzeit) {
    result.motzeiShabbat = result.tzeit;
  }

  return result;
}
