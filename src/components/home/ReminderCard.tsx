import { Pressable, StyleSheet } from 'react-native';

import { rtlContent } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomeCopy } from '@/lib/rebiidCopy';
import {
  formatHomeReminderCountdown,
  formatReminderAppearanceDay,
} from '@/lib/reminderRelativeTime';
import { RtlBlock, RtlText } from '@/src/components/rtl';
import type { UpcomingReminder } from '@/src/engine/types';

interface ReminderCardProps {
  reminder?: UpcomingReminder;
  onPress?: (reminder: UpcomingReminder) => void;
}

export function ReminderCard({ reminder, onPress }: ReminderCardProps) {
  const theme = useAppTheme();

  if (!reminder) {
    return (
      <RtlBlock style={rtlContent}>
        <RtlText style={[styles.empty, { color: theme.colors.textSecondary }]}>
          {HomeCopy.quietMessage}
        </RtlText>
      </RtlBlock>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(reminder)}
      style={({ pressed }) => [styles.pressable, pressed && { opacity: theme.motion.pressOpacity }]}>
      <RtlBlock style={rtlContent}>
        <RtlText variant="heading" style={[styles.title, { color: theme.colors.text }]}>
          {reminder.title}
        </RtlText>
        <RtlText style={[styles.meta, { color: theme.colors.textSecondary }]}>
          {HomeCopy.appearancePrefix} {formatReminderAppearanceDay(reminder)}
        </RtlText>
        <RtlText style={[styles.countdown, { color: theme.colors.accent }]}>
          {formatHomeReminderCountdown(reminder)}
        </RtlText>
      </RtlBlock>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 44,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  countdown: {
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
});
