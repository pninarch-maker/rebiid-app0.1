import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import {
  hebrewStartFlexDirection,
  rtlSubtitle,
  rtlValueText,
  rtlValueTextRtl,
} from '@/constants/layout';
import { useTheme } from '@/src/theme/useTheme';

interface RtlLabelValueRowProps {
  label: string;
  value: string;
  valueDirection?: 'ltr' | 'rtl';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  bordered?: boolean;
}

export function RtlLabelValueRow({
  label,
  value,
  valueDirection = 'rtl',
  style,
  labelStyle,
  valueStyle,
  bordered = false,
}: RtlLabelValueRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { flexDirection: hebrewStartFlexDirection() },
        bordered && { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
        style,
      ]}>
      <Text style={[styles.label, { color: theme.colors.textMuted }, labelStyle]}>{label}</Text>
      <Text
        style={[
          valueDirection === 'ltr' ? styles.valueLtr : styles.valueRtl,
          { color: theme.colors.text },
          valueStyle,
        ]}>
        {value}
      </Text>
    </View>
  );
}

interface RtlLabelValueRowCustomProps {
  label: string;
  value: ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function RtlLabelValueRowCustom({
  label,
  value,
  style,
  labelStyle,
}: RtlLabelValueRowCustomProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { flexDirection: hebrewStartFlexDirection() }, style]}>
      <Text style={[styles.label, { color: theme.colors.textMuted }, labelStyle]}>{label}</Text>
      <View style={styles.valueWrap}>{value}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    width: '100%',
    alignSelf: 'stretch',
  },
  label: {
    flexShrink: 0,
    fontSize: 14,
    ...rtlSubtitle,
  },
  valueLtr: {
    ...rtlValueText,
    fontSize: 15,
    fontWeight: '500',
  },
  valueRtl: {
    ...rtlValueTextRtl,
    fontSize: 15,
    fontWeight: '500',
  },
  valueWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
});
