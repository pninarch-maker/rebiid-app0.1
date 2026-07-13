import { StyleSheet } from 'react-native';

import {
  baseScrollContent,
  Layout,
  rtlCardText,
  rtlContentBlock,
  rtlHeadingText,
  Typography,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import type { ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createRemindersStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    header: {
      marginBottom: Layout.headerMarginBottom,
      ...rtlContentBlock,
    },
    title: {
      fontSize: Typography.screenTitle,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      ...rtlHeadingText,
    },
    subtitle: {
      fontSize: Typography.body,
      color: colors.textMuted,
      ...rtlHeadingText,
    },
    emptyCard: {
      ...surfaces.baseCard,
      ...rtlContentBlock,
    },
    emptyText: {
      fontSize: Typography.body,
      color: colors.textSecondary,
      ...rtlHeadingText,
    },
    dayCard: {
      ...surfaces.baseCard,
      ...rtlContentBlock,
    },
    dayHeader: {
      marginBottom: 16,
      ...rtlContentBlock,
      gap: 4,
    },
    hebrewDate: {
      fontSize: Typography.reminderTitle,
      fontWeight: '600',
      color: colors.text,
      ...rtlHeadingText,
    },
    gregorianDate: {
      fontSize: Typography.caption,
      color: colors.textMuted,
      // Mixed Hebrew + Gregorian line: keep RTL container alignment; do not reverse digits.
      ...rtlHeadingText,
    },
    reminderItem: {
      paddingVertical: 12,
      ...rtlContentBlock,
      gap: 4,
      borderRadius: Layout.navButtonRadius,
      minHeight: Layout.minTouchTarget,
    },
    reminderItemPressed: {
      backgroundColor: surfaces.pressedRow,
    },
    reminderItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    reminderTitle: {
      fontSize: Typography.body,
      fontWeight: '600',
      color: colors.text,
      ...rtlHeadingText,
    },
    relativeTime: {
      fontSize: Typography.caption,
      fontWeight: '600',
      color: colors.primary,
      ...rtlHeadingText,
    },
    reminderMessage: {
      fontSize: Typography.bodySmall,
      color: colors.textSecondary,
      ...rtlHeadingText,
      lineHeight: 22,
    },
    screenSafeArea: surfaces.screenSafeArea,
    scrollContent: baseScrollContent,
  });
}
