import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { rtlContent } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PhysicalRow, RtlText } from '@/src/components/rtl';

interface RtlCardHeaderProps {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  iconSize?: number;
}

/**
 * Home / bento card header: icon on the physical far right, Hebrew title right-aligned.
 * physicalLtrRow + [title, icon] — native RTL must not mirror this row again.
 */
export function RtlCardHeader({
  title,
  icon,
  style,
  titleStyle,
  iconSize = 20,
}: RtlCardHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.header, rtlContent, style]}>
      <PhysicalRow style={styles.row}>
        <RtlText
          inRow
          variant="heading"
          style={[styles.title, { color: theme.colors.primary }, titleStyle]}
          accessibilityRole="header">
          {title}
        </RtlText>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={iconSize}
            color={theme.colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
      </PhysicalRow>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  row: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
