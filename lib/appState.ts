import { DEFAULT_APP_SETTINGS, type AppSettings } from './settingsTypes';

export let currentAppSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };

export function setCurrentAppSettings(settings: AppSettings): void {
  currentAppSettings = settings;
}
