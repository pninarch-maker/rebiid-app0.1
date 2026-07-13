import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** REBIID Design System v1.0 — light palette (default). Leaf primitive — no theme imports. */
export const ColorsLight = {
  primary: '#3657D6',
  secondary: '#5B7FFF',
  accent: '#E8B64A',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0EA5E9',
  background: '#F7F9FC',
  card: '#FFFFFF',
  cardBorder: '#E6EAF2',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  divider: '#E6EAF2',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#3657D6',
  floatingButton: '#E8B64A',
  floatingButtonIcon: '#FFFFFF',
  overlay: 'rgba(17, 24, 39, 0.45)',
  glassSurface: 'rgba(255, 255, 255, 0.94)',
  shadow: '#3657D6',
} as const;

/** REBIID Design System v1.0 — dark palette (dedicated, not inverted). */
export const ColorsDark = {
  primary: '#5B7FFF',
  secondary: '#7B9BFF',
  accent: '#D4A84A',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#38BDF8',
  background: '#0F172A',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  divider: '#334155',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#5B7FFF',
  floatingButton: '#D4A84A',
  floatingButtonIcon: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.72)',
  glassSurface: 'rgba(30, 41, 59, 0.94)',
  shadow: '#5B7FFF',
} as const;

/** Time-of-day accent backgrounds (subtle hero tint only). */
export const TimeThemeBackgrounds = {
  morning: '#EEF4FF',
  afternoon: '#F0F7FF',
  evening: '#E8ECF8',
  shabbat: '#FBF6EA',
} as const;

export type AppColors = typeof ColorsLight & {
  /** @deprecated Use `primary` */
  tint: string;
  /** @deprecated Use `error` */
  danger: string;
};

/** Default light palette with legacy aliases — used by layout and unthemed paths. */
export const Colors: AppColors = {
  ...ColorsLight,
  tint: ColorsLight.primary,
  danger: ColorsLight.error,
};

/** Semantic design tokens — source of truth for REBIID v1.0 */
export const SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 64,
} as const;

export const RadiusTokens = {
  card: 28,
  button: 20,
  input: 18,
  bottomSheet: 32,
  pill: 999,
  navItem: 16,
} as const;

export const TypographyTokens = {
  greeting: 22,
  sectionTitle: 18,
  mainTitle: 18,
  screenTitle: 28,
  hebrewDateLarge: 44,
  gregorianDateLarge: 18,
  cardTitle: 16,
  cardBody: 15,
  reminderTitle: 16,
  body: 16,
  bodySmall: 14,
  caption: 13,
  micro: 12,
  tabLabel: 12,
} as const;

export const MotionTokens = {
  pressDurationMs: 150,
  fadeDurationMs: 180,
  pressScale: 0.96,
  pressOpacity: 0.82,
} as const;

export const LayoutTokens = {
  screenPaddingMin: 20,
  screenPaddingRatio: 0.05,
  contentMaxWidth: 560,
  scrollPaddingTop: SpacingTokens.xl,
  scrollPaddingBottom: SpacingTokens.xxl,
  cardPadding: SpacingTokens.lg,
  cardBorderWidth: 1,
  minTouchTarget: 44,
  floatingButtonSize: 56,
  tabBarHeight: 76,
  headerMarginBottom: SpacingTokens.xl,
  bentoGridGap: SpacingTokens.md,
  bentoMinTwoColumnWidth: 380,
  bentoMinHeight: 148,
} as const;

export type TimeThemeKey = keyof typeof TimeThemeBackgrounds;

export const ColorTokens = {
  light: ColorsLight,
  dark: ColorsDark,
  timeBackgrounds: TimeThemeBackgrounds,
} as const;

export type ThemeMode = 'light' | 'dark';

export function resolveTimeTheme(date: Date = new Date()): TimeThemeKey {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  return 'evening';
}

export function getPalette(mode: ThemeMode): AppColors {
  const base = mode === 'dark' ? ColorsDark : ColorsLight;
  return {
    ...base,
    tint: base.primary,
    danger: base.error,
  } as AppColors;
}

export function createElevation(color: string, level: 'card' | 'fab' = 'card'): ViewStyle {
  if (level === 'fab') {
    return Platform.select<ViewStyle>({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 32,
      },
      android: { elevation: 6 },
      default: {},
    }) ?? {};
  }

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
    },
    android: { elevation: 4 },
    default: {},
  }) ?? {};
}

export const RtlTextTokens = {
  title: {
    textAlign: 'right',
    writingDirection: 'rtl',
  } satisfies TextStyle,
  body: {
    textAlign: 'right',
    writingDirection: 'rtl',
  } satisfies TextStyle,
  button: {
    textAlign: 'center',
    writingDirection: 'rtl',
  } satisfies TextStyle,
} as const;
