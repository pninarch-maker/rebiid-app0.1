import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { currentAppSettings } from '@/lib/appState';
import { getAppSettings } from '@/lib/settings';
import type { AppSettings } from '@/lib/settingsTypes';

function buildZmanimSettingsKey(settings: AppSettings): string {
  return [
    settings.city,
    settings.latitude,
    settings.longitude,
    settings.timezone,
    settings.candleLightingOffsetMinutes,
    settings.havdalahMethod,
    settings.zmanimProfile,
  ].join('|');
}

/** Re-reads app settings on tab focus so zmanim reflect the selected city and profile. */
export function useZmanimSettingsKey(): string {
  const [key, setKey] = useState(() => buildZmanimSettingsKey(currentAppSettings));

  useFocusEffect(
    useCallback(() => {
      void getAppSettings().then((settings) => {
        setKey(buildZmanimSettingsKey(settings));
      });
    }, []),
  );

  return key;
}
