import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { hebrewStartFlexDirection } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';

interface RtlCardHeaderProps {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  iconSize?: number;
}

/**
 * Home / bento card header: icon on the far right, Hebrew title immediately to its left.
 * Child order [icon, title] + hebrew-start flex — no View `direction` style.
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
    <View
      style={[
        styles.header,
        { flexDirection: hebrewStartFlexDirection() },
        style,
      ]}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={iconSize}
          color={theme.colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
      <Text
        style={[styles.title, { color: theme.colors.primary }, titleStyle]}
        accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
