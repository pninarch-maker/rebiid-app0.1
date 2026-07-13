import { Text, View } from 'react-native';

import type { ZmanimDisplayRow } from '@/lib/zmanimDisplay';
import { createZmanimRowStyles } from '@/src/theme/zmanimRowStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

interface ZmanimRowListProps {
  rows: ZmanimDisplayRow[];
  emptyText?: string;
}

/** Shared zmanim rows — Hebrew label on the right, time on the left. */
export function ZmanimRowList({ rows, emptyText }: ZmanimRowListProps) {
  const styles = useThemeStyles(createZmanimRowStyles);

  if (rows.length === 0) {
    return emptyText ? <Text style={styles.empty}>{emptyText}</Text> : null;
  }

  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <View
          key={row.label}
          style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.time}>{row.time}</Text>
        </View>
      ))}
    </View>
  );
}
