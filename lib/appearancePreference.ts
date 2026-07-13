import type { ThemeMode } from '@/constants/tokens';

export type AppearancePreference = 'light' | 'dark' | 'system';

export const APPEARANCE_PREFERENCE_OPTIONS: {
  key: AppearancePreference;
  label: string;
}[] = [
  { key: 'light', label: '☀️ בהיר' },
  { key: 'dark', label: '🌙 כהה' },
  { key: 'system', label: '⚙️ לפי המכשיר' },
];

export function normalizeAppearancePreference(value: unknown): AppearancePreference {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

export function resolveThemeMode(
  preference: AppearancePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): ThemeMode {
  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}
