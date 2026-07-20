import { HDate } from '@hebcal/core';
import { useCallback, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { baseScrollContent } from '@/constants/layout';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { createCalendarStyles } from '@/src/theme/calendarScreenStyles';
import { useThemeStyles } from '@/src/theme/useTheme';
import { buildReminderDetails, type ReminderDetailsData } from '@/lib/reminderDetails';
import { CalendarCopy } from '@/lib/rebiidCopy';
import { useZmanimSettingsKey } from '@/hooks/useZmanimSettingsKey';
import {
  CALENDAR_VISUAL_COLUMN_ORDER,
  getVisualWeekdayHeadersLeftToRight,
  mapEngineWeekToVisualOrder,
} from '@/lib/calendarWeekLayout';
import { getCityFromZmanimSettingsKey, getZmanimDisplayRows, getZmanimDisplayTitle } from '@/lib/zmanimDisplay';
import { ReminderDetailsModal } from '@/src/components/ReminderDetailsModal';
import { ZmanimModal } from '@/src/components/ZmanimModal';
import { LtrValueText, RtlCenteredText, RtlText } from '@/src/components/rtl';
import { JewishEngine } from '@/src/engine/JewishEngine';
import type { AppReminder } from '@/src/engine/reminders/types';
import type { HebrewMonthDay } from '@/src/engine/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function shiftHebrewMonth(date: Date, deltaMonths: number): Date {
  const hdate = new HDate(date);

  if (deltaMonths > 0) {
    return hdate.add(deltaMonths, 'month').greg();
  }

  return hdate.subtract(Math.abs(deltaMonths), 'month').greg();
}

function hasRoshChodesh(holidays: string[]): boolean {
  return holidays.some((holiday) => holiday.includes('ראש חודש'));
}

export default function CalendarScreen() {
  const { horizontalPadding } = useScreenLayout();
  const styles = useThemeStyles(createCalendarStyles);
  const zmanimSettingsKey = useZmanimSettingsKey();
  const [monthAnchorDate, setMonthAnchorDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<HebrewMonthDay | null>(null);
  const [detailsReminder, setDetailsReminder] = useState<ReminderDetailsData | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [zmanimVisible, setZmanimVisible] = useState(false);

  const month = useMemo(
    () => JewishEngine.getHebrewMonth(monthAnchorDate),
    [monthAnchorDate],
  );

  const selectedDayDetails = useMemo(() => {
    if (!selectedDay?.date) {
      return null;
    }

    return JewishEngine.getToday(selectedDay.date);
  }, [selectedDay, zmanimSettingsKey]);

  const selectedZmanimRows = useMemo(() => {
    if (!selectedDayDetails) {
      return [];
    }

    return getZmanimDisplayRows(selectedDayDetails.zmanim);
  }, [selectedDayDetails]);

  const zmanimTitle = useMemo(
    () => getZmanimDisplayTitle(getCityFromZmanimSettingsKey(zmanimSettingsKey)),
    [zmanimSettingsKey],
  );

  const openReminderDetails = useCallback((reminder: AppReminder, date: Date) => {
    setDetailsReminder(buildReminderDetails(reminder, date));
    setDetailsVisible(true);
  }, []);

  const closeReminderDetails = useCallback(() => {
    setDetailsVisible(false);
    setDetailsReminder(null);
  }, []);

  const changeMonth = useCallback((deltaMonths: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMonthAnchorDate((current) => shiftHebrewMonth(current, deltaMonths));
    setSelectedDay(null);
    setZmanimVisible(false);
  }, []);

  const selectDay = useCallback((day: HebrewMonthDay) => {
    setSelectedDay(day);
    setZmanimVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.screenSafeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[baseScrollContent, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <RtlText style={styles.screenTitle}>{CalendarCopy.screenTitle}</RtlText>
          <RtlText variant="heading" style={styles.monthTitle}>{month.monthTitleHebrew}</RtlText>
          <RtlText style={styles.gregorianRange}>{month.gregorianRangeText}</RtlText>
        </View>

        <View style={styles.navRow}>
          <Pressable style={styles.navButton} onPress={() => changeMonth(-1)}>
            <RtlText style={styles.navButtonText}>חודש קודם</RtlText>
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => changeMonth(1)}>
            <RtlText style={styles.navButtonText}>חודש הבא</RtlText>
          </Pressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekdayRow}>
            {getVisualWeekdayHeadersLeftToRight().map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <RtlCenteredText style={styles.weekdayLabel}>{label}</RtlCenteredText>
              </View>
            ))}
          </View>

          {month.weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {mapEngineWeekToVisualOrder(week.days).map((day, dayIndex) => {
                const engineColumnIndex = CALENDAR_VISUAL_COLUMN_ORDER[dayIndex];
                const isSelected =
                  selectedDay?.date?.getTime() === day.date?.getTime() && day.isCurrentMonth;

                if (!day.isCurrentMonth) {
                  return (
                    <View
                      key={`empty-${weekIndex}-${engineColumnIndex}`}
                      style={styles.dayCell}
                    />
                  );
                }

                return (
                  <Pressable
                    key={day.date?.toISOString() ?? `day-${weekIndex}-${engineColumnIndex}`}
                    style={[
                      styles.dayCell,
                      day.isToday && styles.dayCellToday,
                      day.isShabbat && styles.dayCellShabbat,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => selectDay(day)}>
                    <RtlCenteredText
                      style={[
                        styles.hebrewDayNumber,
                        day.isShabbat && styles.shabbatText,
                        day.isToday && styles.todayText,
                      ]}>
                      {day.hebrewDayNumber}
                    </RtlCenteredText>
                    <LtrValueText style={styles.gregorianDayNumber}>{day.gregorianDayNumber}</LtrValueText>
                    <View style={styles.markerRow}>
                      {hasRoshChodesh(day.holidays) ? (
                        <View style={[styles.markerDot, styles.roshChodeshDot]} />
                      ) : null}
                      {day.holidays.length > 0 && !hasRoshChodesh(day.holidays) ? (
                        <View style={[styles.markerDot, styles.holidayDot]} />
                      ) : null}
                      {day.reminders.slice(0, 3).map((reminder) => (
                        <Pressable
                          key={reminder.id}
                          hitSlop={4}
                          onPress={(event) => {
                            event.stopPropagation?.();
                            if (day.date) {
                              setSelectedDay(day);
                              openReminderDetails(reminder, day.date);
                            }
                          }}>
                          <View style={[styles.markerDot, styles.reminderDot]} />
                        </Pressable>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {selectedDayDetails ? (
          <View style={styles.detailCard}>
            <RtlText variant="heading" style={styles.detailHebrewDate}>{selectedDayDetails.hebrewDate}</RtlText>
            <RtlText style={styles.detailGregorianDate}>{selectedDayDetails.gregorianDate}</RtlText>

            <Pressable
              style={styles.zmanimButton}
              onPress={() => setZmanimVisible(true)}>
              <RtlText style={styles.zmanimButtonText}>{zmanimTitle}</RtlText>
            </Pressable>

            {selectedDayDetails.holidays.length > 0 ? (
              <View style={styles.detailSection}>
                <RtlText variant="heading" style={styles.detailSectionTitle}>{CalendarCopy.holidays}</RtlText>
                {selectedDayDetails.holidays.map((holiday) => (
                  <RtlText key={holiday} style={styles.detailItem}>
                    {holiday}
                  </RtlText>
                ))}
              </View>
            ) : null}

            {selectedDayDetails.reminders.length > 0 ? (
              <View style={styles.detailSection}>
                <RtlText variant="heading" style={styles.detailSectionTitle}>{CalendarCopy.reminders}</RtlText>
                {selectedDayDetails.reminders.map((reminder) => (
                  <Pressable
                    key={reminder.id}
                    style={styles.reminderBlock}
                    onPress={() => {
                      if (selectedDay?.date) {
                        openReminderDetails(reminder, selectedDay.date);
                      }
                    }}>
                    <RtlText style={styles.detailItem}>{reminder.title}</RtlText>
                    <RtlText style={styles.detailSubItem}>{reminder.message}</RtlText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {selectedDayDetails.holidays.length === 0 &&
            selectedDayDetails.reminders.length === 0 ? (
              <RtlText style={styles.detailEmpty}>{CalendarCopy.dayEmpty}</RtlText>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <ReminderDetailsModal
        visible={detailsVisible}
        reminder={detailsReminder}
        onClose={closeReminderDetails}
      />
      <ZmanimModal
        visible={zmanimVisible}
        title={zmanimTitle}
        subtitle={selectedDayDetails?.hebrewDate}
        rows={selectedZmanimRows}
        onClose={() => setZmanimVisible(false)}
      />
    </SafeAreaView>
  );
}
