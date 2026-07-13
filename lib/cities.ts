import { ISRAELI_CITIES, getCityByName, type IsraeliCity } from '@/src/data/israeliCities';

export type { IsraeliCity };

export const CITY_OPTIONS = ISRAELI_CITIES;

export function getCityByKey(name: string): IsraeliCity {
  return getCityByName(name);
}
