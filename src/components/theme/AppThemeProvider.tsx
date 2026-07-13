import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  ColorTokens,
  LayoutTokens,
  MotionTokens,
  RadiusTokens,
  SpacingTokens,
  TypographyTokens,
  getPalette,
  resolveTimeTheme,
  type AppColors,
  type ThemeMode,
  type TimeThemeKey,
} from '@/constants/tokens';
import {
  normalizeAppearancePreference,
  resolveThemeMode,
  type AppearancePreference,
} from '@/lib/appearancePreference';
import { currentAppSettings } from '@/lib/appState';
import { getAppSettings, saveAppSettings } from '@/lib/settings';

export interface AppTheme {
  mode: ThemeMode;
  colors: AppColors;
  timeTheme: TimeThemeKey;
  heroBackground: string;
  spacing: typeof SpacingTokens;
  radius: typeof RadiusTokens;
  typography: typeof TypographyTokens;
  motion: typeof MotionTokens;
  layout: typeof LayoutTokens;
}

interface AppThemeContextValue {
  theme: AppTheme;
  appearancePreference: AppearancePreference;
  setAppearancePreference: (preference: AppearancePreference) => Promise<void>;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearancePreference, setAppearancePreferenceState] = useState<AppearancePreference>(
    normalizeAppearancePreference(currentAppSettings.appearancePreference),
  );

  useEffect(() => {
    void getAppSettings().then((settings) => {
      setAppearancePreferenceState(normalizeAppearancePreference(settings.appearancePreference));
    });
  }, []);

  const mode = resolveThemeMode(appearancePreference, systemScheme);

  const theme = useMemo<AppTheme>(() => {
    const timeTheme = resolveTimeTheme();
    const colors = getPalette(mode);
    const heroBackground =
      mode === 'dark' ? colors.background : ColorTokens.timeBackgrounds[timeTheme];

    return {
      mode,
      colors,
      timeTheme,
      heroBackground,
      spacing: SpacingTokens,
      radius: RadiusTokens,
      typography: TypographyTokens,
      motion: MotionTokens,
      layout: LayoutTokens,
    };
  }, [mode]);

  const setAppearancePreference = useCallback(async (preference: AppearancePreference) => {
    const normalized = normalizeAppearancePreference(preference);
    setAppearancePreferenceState(normalized);

    const nextSettings = {
      ...currentAppSettings,
      appearancePreference: normalized,
    };

    await saveAppSettings(nextSettings);
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme,
      appearancePreference,
      setAppearancePreference,
    }),
    [appearancePreference, setAppearancePreference, theme],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context.theme;
}

export function useAppearancePreference(): Pick<
  AppThemeContextValue,
  'appearancePreference' | 'setAppearancePreference'
> {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppearancePreference must be used within AppThemeProvider');
  }
  return {
    appearancePreference: context.appearancePreference,
    setAppearancePreference: context.setAppearancePreference,
  };
}
