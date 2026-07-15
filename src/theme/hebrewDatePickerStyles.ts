import { StyleSheet } from 'react-native';

import {
  buttonText,
  hebrewStartFlexDirection,
  Layout,
  rtlCardText,
  rtlContentBlock,
  rtlHeadingText,
  Typography,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import { ON_PRIMARY, type ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createHebrewDatePickerStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    fieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      ...rtlHeadingText,
      marginBottom: 8,
    },
    fieldButton: {
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: Layout.minTouchTarget,
      justifyContent: 'center',
      backgroundColor: colors.background,
      ...rtlContentBlock,
    },
    fieldButtonPressed: {
      opacity: 0.88,
    },
    fieldValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      ...rtlHeadingText,
    },
    fieldPlaceholder: {
      fontSize: 16,
      color: colors.textMuted,
      ...rtlHeadingText,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: 20,
    },
    sheet: {
      ...surfaces.modalSheet,
      maxHeight: '90%',
      alignSelf: 'stretch',
      ...rtlContentBlock,
    },
    monthTitle: {
      fontSize: Typography.sectionTitle,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      ...rtlHeadingText,
    },
    navRow: {
      flexDirection: hebrewStartFlexDirection(),
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12,
    },
    navButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Layout.navButtonRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: 'flex-start',
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
      backgroundColor: colors.background,
      borderRadius: Layout.cardRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      padding: Layout.cardPaddingCompact,
      marginBottom: 16,
      ...rtlContentBlock,
    },
    weekdayRow: {
      flexDirection: hebrewStartFlexDirection(),
      marginBottom: 8,
      width: '100%',
    },
    weekdayCell: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 28,
    },
    weekdayLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    weekRow: {
      flexDirection: hebrewStartFlexDirection(),
      marginBottom: 4,
      width: '100%',
    },
    dayCell: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      minHeight: Layout.minTouchTarget,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingTop: 2,
    },
    dayCellToday: {
      backgroundColor: surfaces.calendarTodayBg,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    dayCellSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: surfaces.selectedChipBg,
    },
    dayCellEmpty: {
      opacity: 0,
    },
    dayNumeral: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    dayNumeralToday: {
      color: colors.primary,
    },
    dayNumeralSelected: {
      color: colors.primary,
    },
    actionsRow: {
      flexDirection: hebrewStartFlexDirection(),
      gap: 12,
      ...rtlContentBlock,
    },
    cancelButton: {
      flex: 1,
      minHeight: Layout.minTouchTarget,
      borderRadius: Layout.buttonRadius,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      ...buttonText,
    },
    confirmButton: {
      flex: 1,
      minHeight: Layout.minTouchTarget,
      ...surfaces.primaryButton,
    },
    confirmButtonText: {
      color: ON_PRIMARY,
      fontSize: 16,
      fontWeight: '600',
      ...buttonText,
    },
    confirmDisabled: {
      opacity: 0.5,
    },
  });
}
