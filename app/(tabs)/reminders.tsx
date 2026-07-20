import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenLayout } from '@/hooks/useScreenLayout';
import {
  buildReminderDetailsFromUpcoming,
  type ReminderDetailsData,
} from '@/lib/reminderDetails';
import { EmptyCopy, RemindersScreenCopy } from '@/lib/rebiidCopy';
import { formatRelativeReminderLabel } from '@/lib/reminderRelativeTime';
import { ReminderDetailsModal } from '@/src/components/ReminderDetailsModal';
import { RtlText } from '@/src/components/rtl';
import { createRemindersStyles } from '@/src/theme/remindersScreenStyles';
import { useThemeStyles } from '@/src/theme/useTheme';
import { JewishEngine } from '@/src/engine/JewishEngine';
import { groupUpcomingRemindersByDay } from '@/src/engine/reminders/getUpcomingReminders';
import type { UpcomingReminder } from '@/src/engine/types';

const DAYS_AHEAD = 30;

export default function RemindersScreen() {
  const { horizontalPadding } = useScreenLayout();
  const styles = useThemeStyles(createRemindersStyles);
  const upcomingReminders = useMemo(
    () => JewishEngine.getUpcomingReminders(DAYS_AHEAD),
    [],
  );
  const groupedDays = useMemo(
    () => groupUpcomingRemindersByDay(upcomingReminders),
    [upcomingReminders],
  );
  const [detailsReminder, setDetailsReminder] = useState<ReminderDetailsData | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const openReminderDetails = useCallback((reminder: UpcomingReminder) => {
    setDetailsReminder(buildReminderDetailsFromUpcoming(reminder));
    setDetailsVisible(true);
  }, []);

  const closeReminderDetails = useCallback(() => {
    setDetailsVisible(false);
    setDetailsReminder(null);
  }, []);

  return (
    <SafeAreaView style={styles.screenSafeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <RtlText variant="heading" style={styles.title}>{RemindersScreenCopy.title}</RtlText>
          <RtlText style={styles.subtitle}>{RemindersScreenCopy.subtitle}</RtlText>
        </View>

        {groupedDays.length === 0 ? (
          <View style={[styles.dayCard, styles.emptyCard]}>
            <RtlText style={styles.emptyText}>{EmptyCopy.upcomingReminders}</RtlText>
          </View>
        ) : (
          groupedDays.map((dayGroup) => (
            <View key={dayGroup.dateKey} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <RtlText variant="heading" style={styles.hebrewDate}>{dayGroup.hebrewDate}</RtlText>
                <RtlText style={styles.gregorianDate}>
                  {`${dayGroup.gregorianDate} · ${dayGroup.dayOfWeek}`}
                </RtlText>
              </View>

              {dayGroup.reminders.map((reminder, index) => (
                <Pressable
                  key={reminder.id}
                  style={({ pressed }) => [
                    styles.reminderItem,
                    index < dayGroup.reminders.length - 1 && styles.reminderItemBorder,
                    pressed && styles.reminderItemPressed,
                  ]}
                  onPress={() => openReminderDetails(reminder)}>
                  <RtlText variant="heading" style={styles.reminderTitle}>{reminder.title}</RtlText>
                  <RtlText style={styles.relativeTime}>
                    {formatRelativeReminderLabel(reminder)}
                  </RtlText>
                  <RtlText style={styles.reminderMessage}>{reminder.message}</RtlText>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <ReminderDetailsModal
        visible={detailsVisible}
        reminder={detailsReminder}
        onClose={closeReminderDetails}
      />
    </SafeAreaView>
  );
}
