import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { physicalLabelValueRow } from '@/constants/layout';
import { useTheme } from '@/src/theme/useTheme';
import { LtrValueText, RtlText } from '@/src/components/rtl';

interface RtlLabelValueRowProps {
  label: string;
  value: string;
  valueDirection?: 'ltr' | 'rtl';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  bordered?: boolean;
}

/**
 * Mixed row: value on physical left, Hebrew label on physical right.
 * Uses physicalLabelValueRow (direction ltr) — do not add row-reverse.
 * Left-side Hebrew values use Text (not RtlText) so textAlign stays physical left.
 */
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
        bordered && { borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
        style,
      ]}>
      {valueDirection === 'ltr' ? (
        <LtrValueText style={[{ color: theme.colors.text }, styles.valueBase, valueStyle]}>
          {value}
        </LtrValueText>
      ) : (
        <Text style={[styles.valueRtl, { color: theme.colors.text }, valueStyle]}>{value}</Text>
      )}
      <RtlText inRow style={[styles.label, { color: theme.colors.textMuted }, labelStyle]}>
        {label}
      </RtlText>
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
    <View style={[styles.row, style]}>
      <View style={styles.valueWrap}>{value}</View>
      <RtlText inRow style={[styles.label, { color: theme.colors.textMuted }, labelStyle]}>
        {label}
      </RtlText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...physicalLabelValueRow,
    gap: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
  },
  valueBase: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Intentional physical-left Hebrew value inside physicalLtrRow — do not mirror again.
  valueRtl: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  valueWrap: {
    flexShrink: 0,
    alignItems: 'flex-start',
  },
});
