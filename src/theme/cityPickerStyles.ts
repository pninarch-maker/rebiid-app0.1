import { StyleSheet } from 'react-native';

import {
  Layout,
  Spacing,
  Typography,
  hebrewStartFlexDirection,
  rtlCardText,
  rtlContentBlock,
  rtlInputText,
  rtlOptionRow,
  rtlTitle,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import type { ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createCityPickerSheetStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
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
      maxHeight: '75%',
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
      marginBottom: Spacing.md,
      ...rtlTitle,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: Layout.inputRadius,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.body,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: Spacing.md,
      minHeight: Layout.minTouchTarget,
      ...rtlInputText,
    },
    list: {
      flexGrow: 0,
    },
    optionRow: {
      ...rtlOptionRow,
      flexDirection: hebrewStartFlexDirection(),
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    optionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    optionLabel: {
      flex: 1,
      fontSize: Typography.body,
      color: colors.text,
      ...rtlCardText,
    },
    optionLabelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    checkmark: {
      fontSize: 18,
      color: colors.primary,
      fontWeight: '700',
    },
    emptyText: {
      fontSize: Typography.body,
      color: colors.textSecondary,
      paddingVertical: Spacing.lg,
      ...rtlCardText,
    },
  });
}

export function createCityPickerFieldStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    card: {
      ...surfaces.baseCard,
    },
    row: {
      ...rtlOptionRow,
      flexDirection: hebrewStartFlexDirection(),
    },
    value: {
      flex: 1,
      fontSize: Typography.body,
      fontWeight: '600',
      color: colors.text,
      ...rtlCardText,
    },
    chevron: {
      fontSize: 18,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
}
