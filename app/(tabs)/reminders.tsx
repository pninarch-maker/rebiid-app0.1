import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenLayout } from '@/hooks/useScreenLayout';
import {
  buildReminderDetailsFromUpcoming,
  type ReminderDetailsData,
} from '@/lib/reminderDetails';
import { EmptyCopy, RemindersScreenCopy } from '@/lib/rebiidCopy';
import { formatRelativeReminderLabel } from '@/lib/reminderRelativeTime';
import { ReminderDetailsModal } from '@/src/components/ReminderDetailsModal';
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
          <Text style={styles.title}>{RemindersScreenCopy.title}</Text>
          <Text style={styles.subtitle}>{RemindersScreenCopy.subtitle}</Text>
        </View>

        {groupedDays.length === 0 ? (
          <View style={[styles.dayCard, styles.emptyCard]}>
            <Text style={styles.emptyText}>{EmptyCopy.upcomingReminders}</Text>
          </View>
        ) : (
          groupedDays.map((dayGroup) => (
            <View key={dayGroup.dateKey} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.hebrewDate}>{dayGroup.hebrewDate}</Text>
                <Text style={styles.gregorianDate}>
                  {`${dayGroup.gregorianDate} · ${dayGroup.dayOfWeek}`}
                </Text>
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
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.relativeTime}>
                    {formatRelativeReminderLabel(reminder)}
                  </Text>
                  <Text style={styles.reminderMessage}>{reminder.message}</Text>
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
