import { StyleSheet } from 'react-native';

import {
  Layout,
  physicalLabelValueRow,
  rtlContent,
  rtlHeadingText,
  rtlValueText,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';

export function createZmanimRowStyles(theme: AppTheme) {
  const { colors } = theme;

  return StyleSheet.create({
    list: {
      ...rtlContent,
    },
    row: {
      ...physicalLabelValueRow,
      alignSelf: 'stretch',
      paddingVertical: 8,
      minHeight: Layout.minTouchTarget,
      gap: 16,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    labelWrap: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
    },
    label: {
      fontSize: 15,
      color: colors.textSecondary,
      ...rtlHeadingText,
    },
    time: {
      flexShrink: 0,
      minWidth: 56,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      ...rtlValueText,
    },
    empty: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      ...rtlHeadingText,
    },
  });
}
