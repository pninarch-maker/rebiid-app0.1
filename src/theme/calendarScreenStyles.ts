import { StyleSheet } from 'react-native';

import { createElevation } from '@/constants/tokens';
import {
  buttonText,
  physicalHebrewRow,
  physicalLtrRow,
  Layout,
  rtlCardText,
  rtlContentBlock,
  rtlHeadingText,
  Typography,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import { ON_PRIMARY, type ThemedSurfaces } from '@/src/theme/themedSurfaces';

const MARKER_ROSH_CHODESH = '#7C3AED';

export function createCalendarStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    header: {
      marginBottom: 20,
      ...rtlContentBlock,
    },
    screenTitle: {
      fontSize: Typography.body,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 8,
      ...rtlHeadingText,
    },
    monthTitle: {
      fontSize: Typography.screenTitle,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      ...rtlHeadingText,
    },
    gregorianRange: {
      fontSize: Typography.caption,
      color: colors.textMuted,
      ...rtlHeadingText,
    },
    navRow: {
      ...physicalHebrewRow,
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    navButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Layout.navButtonRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: 'stretch',
      justifyContent: 'center',
      minHeight: Layout.minTouchTarget,
    },
    navButtonText: {
      fontSize: Typography.bodySmall,
      fontWeight: '600',
      color: colors.text,
      ...rtlCardText,
      alignSelf: 'stretch',
    },
    calendarCard: {
      backgroundColor: colors.card,
      borderRadius: Layout.cardRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      padding: Layout.cardPaddingCompact,
      marginBottom: Layout.cardMarginBottom,
      overflow: 'hidden',
      alignSelf: 'stretch',
      ...createElevation(colors.shadow),
    },
    weekdayRow: {
      // Visual left-to-right: ש׳ … א׳ via mapEngineWeekToVisualOrder + physicalLtrRow.
      ...physicalLtrRow,
      marginBottom: 8,
    },
    weekdayCell: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekdayLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    weekRow: {
      ...physicalLtrRow,
      marginBottom: 4,
    },
    dayCell: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingTop: 2,
      overflow: 'hidden',
    },
    dayCellToday: {
      backgroundColor: surfaces.calendarTodayBg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    dayCellShabbat: {
      backgroundColor: surfaces.calendarShabbatBg,
    },
    dayCellSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    hebrewDayNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    gregorianDayNumber: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
      textAlign: 'center',
    },
    shabbatText: {
      color: surfaces.calendarShabbatText,
    },
    todayText: {
      color: colors.primary,
    },
    markerRow: {
      ...physicalLtrRow,
      justifyContent: 'flex-end',
      gap: 3,
      marginTop: 4,
      minHeight: 6,
    },
    markerDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    roshChodeshDot: {
      backgroundColor: MARKER_ROSH_CHODESH,
    },
    holidayDot: {
      backgroundColor: colors.primary,
    },
    reminderDot: {
      backgroundColor: colors.accent,
    },
    detailCard: {
      ...surfaces.baseCard,
      ...rtlContentBlock,
      gap: 8,
    },
    detailHebrewDate: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      ...rtlHeadingText,
    },
    detailGregorianDate: {
      fontSize: 15,
      color: colors.textMuted,
      ...rtlHeadingText,
      marginBottom: 8,
    },
    zmanimButton: {
      width: '100%',
      ...surfaces.primaryButton,
      marginBottom: 12,
    },
    zmanimButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: ON_PRIMARY,
      ...buttonText,
    },
    detailSection: {
      ...rtlContentBlock,
      marginTop: 8,
      gap: 6,
    },
    detailSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      ...rtlHeadingText,
    },
    detailItem: {
      fontSize: 15,
      color: colors.text,
      ...rtlHeadingText,
    },
    detailSubItem: {
      fontSize: 14,
      color: colors.textSecondary,
      ...rtlHeadingText,
    },
    reminderBlock: {
      gap: 2,
      paddingVertical: 8,
      ...rtlContentBlock,
    },
    detailEmpty: {
      fontSize: 14,
      color: colors.textSecondary,
      ...rtlHeadingText,
    },
    screenSafeArea: surfaces.screenSafeArea,
  });
}
