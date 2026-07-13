import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { createElevation } from '@/constants/tokens';
import { Layout, Typography, buttonText, hebrewText, rtlCardText, rtlContentBlock, rtlSubtitle, rtlTitle } from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';

/** White label on primary buttons — same in light and dark. */
export const ON_PRIMARY = '#FFFFFF';

export interface ThemedSurfaces {
  screenSafeArea: ViewStyle;
  baseCard: ViewStyle;
  modalSheet: ViewStyle;
  primaryButton: ViewStyle;
  switchTrack: { false: string; true: string };
  switchThumb: (enabled: boolean) => string;
  calendarTodayBg: string;
  calendarShabbatBg: string;
  calendarShabbatText: string;
  pressedRow: string;
  selectedChipBg: string;
  warningText: string;
  tabActiveBg: string;
}

export function getThemedSurfaces(theme: AppTheme): ThemedSurfaces {
  const { colors, mode } = theme;
  const isDark = mode === 'dark';

  return {
    screenSafeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    baseCard: {
      backgroundColor: colors.card,
      borderRadius: Layout.cardRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      padding: Layout.cardPadding,
      marginBottom: Layout.cardMarginBottom,
      alignSelf: 'stretch',
      width: '100%',
      ...createElevation(colors.shadow),
    },
    modalSheet: {
      backgroundColor: colors.glassSurface,
      borderRadius: Layout.bottomSheetRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      padding: 24,
      alignSelf: 'stretch',
      width: '100%',
      ...createElevation(colors.shadow),
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: Layout.buttonRadius,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      minHeight: Layout.minTouchTarget,
      justifyContent: 'center',
    },
    switchTrack: { false: colors.divider, true: colors.secondary },
    switchThumb: (enabled: boolean) => (enabled ? colors.primary : colors.card),
    calendarTodayBg: isDark ? 'rgba(91, 127, 255, 0.22)' : '#EEF2FF',
    calendarShabbatBg: isDark ? 'rgba(148, 163, 184, 0.14)' : '#F3F4F6',
    calendarShabbatText: isDark ? colors.textSecondary : '#4B5563',
    pressedRow: isDark ? 'rgba(148, 163, 184, 0.16)' : '#F1F5F9',
    selectedChipBg: isDark ? 'rgba(91, 127, 255, 0.2)' : '#EEF2FF',
    warningText: isDark ? colors.warning : '#B45309',
    tabActiveBg: isDark ? 'rgba(91, 127, 255, 0.16)' : 'rgba(54, 87, 214, 0.1)',
  };
}

export const themedTypography = {
  rtlTitle,
  rtlSubtitle,
  rtlCardText,
  rtlContentBlock,
  buttonText,
  hebrewText,
  Typography,
  Layout,
} as const;
