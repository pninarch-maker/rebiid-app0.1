import { View } from 'react-native';

import type { ZmanimDisplayRow } from '@/lib/zmanimDisplay';
import { LtrValueText, RtlText } from '@/src/components/rtl';
import { createZmanimRowStyles } from '@/src/theme/zmanimRowStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

interface ZmanimRowListProps {
  rows: ZmanimDisplayRow[];
  emptyText?: string;
}

/** Shared zmanim rows — Hebrew label physical right, LTR time physical left. */
export function ZmanimRowList({ rows, emptyText }: ZmanimRowListProps) {
  const styles = useThemeStyles(createZmanimRowStyles);

  if (rows.length === 0) {
    return emptyText ? (
      <View style={styles.list}>
        <RtlText style={styles.empty}>{emptyText}</RtlText>
      </View>
    ) : null;
  }

  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
          <LtrValueText style={styles.time}>{row.time}</LtrValueText>
          <View style={styles.labelWrap}>
            <RtlText inRow style={styles.label}>
              {row.label}
            </RtlText>
          </View>
        </View>
      ))}
    </View>
  );
}
