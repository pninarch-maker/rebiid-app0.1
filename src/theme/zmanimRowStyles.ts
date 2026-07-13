import { StyleSheet } from 'react-native';

import { hebrewStartFlexDirection, Layout, rtlCardText } from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';

export function createZmanimRowStyles(theme: AppTheme) {
  const { colors } = theme;

  return StyleSheet.create({
    list: {
      alignSelf: 'stretch',
      width: '100%',
    },
    row: {
      // Child order [label, time] + hebrew-start flex → label far right, time far left.
      width: '100%',
      alignSelf: 'stretch',
      flexDirection: hebrewStartFlexDirection(),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      minHeight: Layout.minTouchTarget,
      gap: 16,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    label: {
      flexShrink: 1,
      flexGrow: 1,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      ...rtlCardText,
    },
    time: {
      flexShrink: 0,
      minWidth: 56,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    empty: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      alignSelf: 'stretch',
      ...rtlCardText,
    },
  });
}
