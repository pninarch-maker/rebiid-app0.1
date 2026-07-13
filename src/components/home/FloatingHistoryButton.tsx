import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { createElevation } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/useAppTheme';

interface FloatingHistoryButtonProps {
  accessibilityLabel: string;
  bottom: number;
  /** Physical left inset — keeps the FAB bottom-start for thumb reach across platforms. */
  left: number;
  onPress: () => void;
}

export function FloatingHistoryButton({
  accessibilityLabel,
  bottom,
  left,
  onPress,
}: FloatingHistoryButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          left,
          bottom,
          width: theme.layout.floatingButtonSize,
          height: theme.layout.floatingButtonSize,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.floatingButton,
          ...(pressed ? { transform: [{ scale: theme.motion.pressScale }] } : {}),
          opacity: pressed ? 0.92 : 1,
          ...createElevation(theme.colors.accent, 'fab'),
        },
      ]}>
      <MaterialCommunityIcons
        name="book-open-variant"
        size={26}
        color={theme.colors.floatingButtonIcon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
