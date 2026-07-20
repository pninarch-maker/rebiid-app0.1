import { StyleSheet } from 'react-native';

import {
  Layout,
  Motion,
  Spacing,
  Typography,
  buttonText,
  physicalControlRow,
  rtlCardText,
  rtlContent,
  rtlContentBlock,
  rtlHeadingText,
  rtlOptionRow,
  rtlTitle,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import { ON_PRIMARY, type ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createNotificationCategorySheetStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      ...surfaces.modalSheet,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      maxHeight: '88%',
      ...rtlContentBlock,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.divider,
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: Typography.sectionTitle,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.xs,
      ...rtlHeadingText,
      ...rtlTitle,
    },
    subtitle: {
      fontSize: Typography.cardBody,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
      lineHeight: 22,
      ...rtlHeadingText,
      ...rtlCardText,
    },
    scrollArea: {
      flexGrow: 0,
    },
    sectionLabel: {
      fontSize: Typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
      marginTop: Spacing.sm,
      ...rtlHeadingText,
      ...rtlTitle,
    },
    group: {
      backgroundColor: colors.card,
      borderRadius: Layout.inputRadius,
      borderWidth: Layout.cardBorderWidth,
      borderColor: colors.cardBorder,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    optionRow: {
      ...rtlOptionRow,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    optionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    optionLabel: {
      flex: 1,
      fontSize: Typography.cardBody,
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
      ...rtlHeadingText,
      ...rtlCardText,
    },
    optionLabelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    toggleRow: {
      ...physicalControlRow,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.md,
      justifyContent: 'space-between',
    },
    toggleLabel: {
      flex: 1,
      fontSize: Typography.cardBody,
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
      ...rtlHeadingText,
      ...rtlCardText,
    },
    saveButton: {
      ...surfaces.primaryButton,
      marginTop: Spacing.md,
    },
    saveButtonText: {
      color: ON_PRIMARY,
      fontSize: Typography.body,
      fontWeight: '600',
      ...buttonText,
    },
    pressed: {
      opacity: Motion.pressOpacity,
      transform: [{ scale: Motion.pressScale }],
    },
  });
}

export function createNotificationCategoriesSectionStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      ...surfaces.baseCard,
      marginBottom: 0,
      overflow: 'hidden',
    },
    categoryRow: {
      ...rtlOptionRow,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    rowTextPressable: {
      flex: 1,
      gap: 4,
      ...rtlContent,
      minHeight: Layout.minTouchTarget,
      justifyContent: 'center',
    },
    rowPressed: {
      opacity: 0.82,
    },
    rowTitle: {
      fontSize: Typography.cardTitle,
      fontWeight: '600',
      color: colors.text,
      ...rtlHeadingText,
      ...rtlTitle,
    },
    rowDescription: {
      fontSize: Typography.caption,
      color: colors.textSecondary,
      lineHeight: 20,
      ...rtlHeadingText,
      ...rtlCardText,
    },
  });
}
