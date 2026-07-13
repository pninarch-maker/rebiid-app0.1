import { Pressable, StyleSheet, Text } from 'react-native';

import { rtlHeadingText } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomeCopy } from '@/lib/rebiidCopy';
import {
  formatHomeReminderCountdown,
  formatReminderAppearanceDay,
} from '@/lib/reminderRelativeTime';
import type { UpcomingReminder } from '@/src/engine/types';

interface ReminderCardProps {
  reminder?: UpcomingReminder;
  onPress?: (reminder: UpcomingReminder) => void;
}

export function ReminderCard({ reminder, onPress }: ReminderCardProps) {
  const theme = useAppTheme();

  if (!reminder) {
    return (
      <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
        {HomeCopy.quietMessage}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(reminder)}
      style={({ pressed }) => [styles.pressable, pressed && { opacity: theme.motion.pressOpacity }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{reminder.title}</Text>
      <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
        {HomeCopy.appearancePrefix} {formatReminderAppearanceDay(reminder)}
      </Text>
      <Text style={[styles.countdown, { color: theme.colors.accent }]}>
        {formatHomeReminderCountdown(reminder)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
    width: '100%',
    gap: 6,
    minHeight: 44,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    ...rtlHeadingText,
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
    ...rtlHeadingText,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '600',
    ...rtlHeadingText,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    ...rtlHeadingText,
  },
});
