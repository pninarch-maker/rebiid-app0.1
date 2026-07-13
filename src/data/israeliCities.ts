export interface IsraeliCity {
  name: string;
  latitude: number;
  longitude: number;
  timezone: 'Asia/Jerusalem';
}

export const ISRAELI_CITIES: IsraeliCity[] = [
  { name: 'ירושלים', latitude: 31.7683, longitude: 35.2137, timezone: 'Asia/Jerusalem' },
  { name: 'תל אביב', latitude: 32.0853, longitude: 34.7818, timezone: 'Asia/Jerusalem' },
  { name: 'חיפה', latitude: 32.794, longitude: 34.9896, timezone: 'Asia/Jerusalem' },
  { name: 'באר שבע', latitude: 31.2518, longitude: 34.7913, timezone: 'Asia/Jerusalem' },
  { name: 'פתח תקווה', latitude: 32.084, longitude: 34.8878, timezone: 'Asia/Jerusalem' },
  { name: 'נתניה', latitude: 32.3215, longitude: 34.8532, timezone: 'Asia/Jerusalem' },
  { name: 'בני ברק', latitude: 32.0809, longitude: 34.8338, timezone: 'Asia/Jerusalem' },
  { name: 'רמת גן', latitude: 32.0684, longitude: 34.8248, timezone: 'Asia/Jerusalem' },
  { name: 'גבעתיים', latitude: 32.0716, longitude: 34.8116, timezone: 'Asia/Jerusalem' },
  { name: 'ראשון לציון', latitude: 31.973, longitude: 34.7925, timezone: 'Asia/Jerusalem' },
  { name: 'חולון', latitude: 32.0114, longitude: 34.7795, timezone: 'Asia/Jerusalem' },
  { name: 'בת ים', latitude: 32.0171, longitude: 34.7454, timezone: 'Asia/Jerusalem' },
  { name: 'אשדוד', latitude: 31.8044, longitude: 34.6553, timezone: 'Asia/Jerusalem' },
  { name: 'אשקלון', latitude: 31.6688, longitude: 34.5743, timezone: 'Asia/Jerusalem' },
  { name: 'רחובות', latitude: 31.8948, longitude: 34.8096, timezone: 'Asia/Jerusalem' },
  { name: 'מודיעין', latitude: 31.8939, longitude: 35.0142, timezone: 'Asia/Jerusalem' },
  { name: 'בית שמש', latitude: 31.7514, longitude: 34.9881, timezone: 'Asia/Jerusalem' },
  { name: 'ביתר עילית', latitude: 31.688, longitude: 35.106, timezone: 'Asia/Jerusalem' },
  { name: 'מודיעין עילית', latitude: 31.93, longitude: 35.039, timezone: 'Asia/Jerusalem' },
  { name: 'אלעד', latitude: 32.049, longitude: 34.958, timezone: 'Asia/Jerusalem' },
  { name: 'ראש העין', latitude: 32.0956, longitude: 34.9566, timezone: 'Asia/Jerusalem' },
  { name: 'הרצליה', latitude: 32.1663, longitude: 34.8436, timezone: 'Asia/Jerusalem' },
  { name: 'רעננה', latitude: 32.1848, longitude: 34.8713, timezone: 'Asia/Jerusalem' },
  { name: 'כפר סבא', latitude: 32.175, longitude: 34.9069, timezone: 'Asia/Jerusalem' },
  { name: 'חדרה', latitude: 32.434, longitude: 34.9195, timezone: 'Asia/Jerusalem' },
  { name: 'עפולה', latitude: 32.609, longitude: 35.289, timezone: 'Asia/Jerusalem' },
  { name: 'טבריה', latitude: 32.7955, longitude: 35.53, timezone: 'Asia/Jerusalem' },
  { name: 'צפת', latitude: 32.9646, longitude: 35.496, timezone: 'Asia/Jerusalem' },
  { name: 'אילת', latitude: 29.5577, longitude: 34.9519, timezone: 'Asia/Jerusalem' },
  { name: 'אריאל', latitude: 32.1064, longitude: 35.1844, timezone: 'Asia/Jerusalem' },
];

export function getCityByName(name: string): IsraeliCity {
  return ISRAELI_CITIES.find((city) => city.name === name) ?? ISRAELI_CITIES[0];
}
