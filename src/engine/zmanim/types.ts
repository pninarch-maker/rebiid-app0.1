/** Halachic zmanim calculation profile (GRA is the app default). */
export type ZmanimCalculationProfile = 'gra' | 'magen_avraham';

export const DEFAULT_ZMANIM_PROFILE: ZmanimCalculationProfile = 'gra';

export interface JewishDayZmanim {
  alotHashachar?: string;
  sunrise?: string;
  sofZmanShma?: string;
  sofZmanTfilla?: string;
  chatzot?: string;
  minchaGedola?: string;
  minchaKetana?: string;
  plagHaMincha?: string;
  sunset?: string;
  tzeit?: string;
  candleLighting?: string;
  havdalah?: string;
  motzeiShabbat?: string;
  /** @deprecated Use tzeit / motzeiShabbat / havdalah — kept for reminder timing. */
  nightfall?: string;
}
