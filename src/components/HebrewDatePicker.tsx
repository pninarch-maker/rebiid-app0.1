import { gematriya, HDate } from '@hebcal/core';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { formatHebrewMonthTitle } from '@/src/engine/calendar/formatters';
import {
  getVisualWeekdayHeadersLeftToRight,
  mapEngineWeekToVisualOrder,
} from '@/lib/calendarWeekLayout';
import {
  formatHebrewCustomDate,
  formatHebrewDayNumeral,
  toStoredHebrewMonthName,
} from '@/lib/hebrewMonths';
import { HebrewDatePickerCopy } from '@/lib/rebiidCopy';
import { RtlCenteredText, RtlText } from '@/src/components/rtl';
import { createHebrewDatePickerStyles } from '@/src/theme/hebrewDatePickerStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

export interface HebrewDateValue {
  hebrewMonth: string;
  hebrewDay: number;
  /** Full Hebrew year when known (personal reminders). Optional for legacy month+day pickers. */
  hebrewYear?: number;
}

interface HebrewDatePickerProps {
  value: HebrewDateValue;
  onChange: (next: HebrewDateValue) => void;
  /** When true, display includes the Hebrew year and selection stores it. */
  includeYear?: boolean;
}

interface PickerDayCell {
  key: string;
  day: number | null;
  gregorian: Date | null;
  hebrewYear: number | null;
  isToday: boolean;
  monthName: string | null;
}

function shiftHebrewMonth(date: Date, deltaMonths: number): Date {
  const hdate = new HDate(date);
  if (deltaMonths > 0) {
    return hdate.add(deltaMonths, 'month').greg();
  }
  return hdate.subtract(Math.abs(deltaMonths), 'month').greg();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildPickerWeeks(anchorDate: Date): PickerDayCell[][] {
  const reference = new HDate(anchorDate);
  const month = reference.getMonth();
  const year = reference.getFullYear();
  const daysInMonth = HDate.daysInMonth(month, year);
  const firstOfMonth = new HDate(1, month, year);
  const today = startOfLocalDay(new Date()).getTime();
  const weeks: PickerDayCell[][] = [];
  let currentWeek: PickerDayCell[] = [];

  for (let index = 0; index < firstOfMonth.getDay(); index += 1) {
    currentWeek.push({
      key: `empty-start-${index}`,
      day: null,
      gregorian: null,
      hebrewYear: null,
      isToday: false,
      monthName: null,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const hdate = new HDate(day, month, year);
    const gregorian = startOfLocalDay(hdate.greg());
    currentWeek.push({
      key: gregorian.toISOString(),
      day,
      gregorian,
      hebrewYear: year,
      isToday: gregorian.getTime() === today,
      monthName: toStoredHebrewMonthName(String(hdate.getMonthName())),
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        key: `empty-end-${currentWeek.length}`,
        day: null,
        gregorian: null,
        hebrewYear: null,
        isToday: false,
        monthName: null,
      });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function HebrewDatePicker({
  value,
  onChange,
  includeYear = false,
}: HebrewDatePickerProps) {
  const styles = useThemeStyles(createHebrewDatePickerStyles);
  const [visible, setVisible] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [draft, setDraft] = useState<HebrewDateValue>(value);

  const monthMeta = useMemo(() => {
    const hdate = new HDate(monthAnchor);
    return {
      title: formatHebrewMonthTitle(hdate.getMonth(), hdate.getFullYear()),
      weeks: buildPickerWeeks(monthAnchor),
    };
  }, [monthAnchor]);

  const displayValue =
    includeYear && value.hebrewYear
      ? `${formatHebrewCustomDate(value.hebrewDay, value.hebrewMonth)} ${gematriya(value.hebrewYear)}`
      : formatHebrewCustomDate(value.hebrewDay, value.hebrewMonth);

  const openPicker = useCallback(() => {
    setDraft(value);
    setMonthAnchor(new Date());
    setVisible(true);
  }, [value]);

  const closePicker = useCallback(() => {
    setVisible(false);
  }, []);

  const confirmSelection = useCallback(() => {
    onChange(draft);
    setVisible(false);
  }, [draft, onChange]);

  return (
    <View>
      <RtlText style={styles.fieldLabel}>{HebrewDatePickerCopy.fieldLabel}</RtlText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={displayValue}
        onPress={openPicker}
        style={({ pressed }) => [styles.fieldButton, pressed && styles.fieldButtonPressed]}>
        <RtlText style={styles.fieldValue}>{displayValue}</RtlText>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <RtlText variant="heading" style={styles.monthTitle}>
              {monthMeta.title}
            </RtlText>

            <View style={styles.navRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={HebrewDatePickerCopy.nextMonth}
                style={styles.navButton}
                onPress={() => setMonthAnchor((current) => shiftHebrewMonth(current, 1))}>
                <RtlText style={styles.navButtonText}>{HebrewDatePickerCopy.nextMonth}</RtlText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={HebrewDatePickerCopy.prevMonth}
                style={styles.navButton}
                onPress={() => setMonthAnchor((current) => shiftHebrewMonth(current, -1))}>
                <RtlText style={styles.navButtonText}>{HebrewDatePickerCopy.prevMonth}</RtlText>
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

              {monthMeta.weeks.map((week, weekIndex) => (
                <View key={`week-${weekIndex}`} style={styles.weekRow}>
                  {mapEngineWeekToVisualOrder(week).map((cell) => {
                    if (cell.day === null || !cell.monthName) {
                      return <View key={cell.key} style={[styles.dayCell, styles.dayCellEmpty]} />;
                    }

                    const selected =
                      draft.hebrewDay === cell.day &&
                      (toStoredHebrewMonthName(draft.hebrewMonth) === cell.monthName ||
                        (toStoredHebrewMonthName(draft.hebrewMonth) === 'Adar' &&
                          (cell.monthName === 'Adar' || cell.monthName === 'Adar II'))) &&
                      (!includeYear ||
                        draft.hebrewYear == null ||
                        draft.hebrewYear === cell.hebrewYear);
                    const numeral = formatHebrewDayNumeral(cell.day);
                    const accessibilityLabel = formatHebrewCustomDate(cell.day, cell.monthName);

                    return (
                      <Pressable
                        key={cell.key}
                        accessibilityRole="button"
                        accessibilityLabel={accessibilityLabel}
                        accessibilityState={{ selected }}
                        style={[
                          styles.dayCell,
                          cell.isToday && styles.dayCellToday,
                          selected && styles.dayCellSelected,
                        ]}
                        onPress={() =>
                          setDraft({
                            hebrewMonth: cell.monthName!,
                            hebrewDay: cell.day!,
                            ...(includeYear && cell.hebrewYear
                              ? { hebrewYear: cell.hebrewYear }
                              : {}),
                          })
                        }>
                        <RtlCenteredText
                          style={[
                            styles.dayNumeral,
                            cell.isToday && styles.dayNumeralToday,
                            selected && styles.dayNumeralSelected,
                          ]}>
                          {numeral}
                        </RtlCenteredText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={HebrewDatePickerCopy.confirm}
                style={styles.confirmButton}
                onPress={confirmSelection}>
                <RtlCenteredText style={styles.confirmButtonText}>
                  {HebrewDatePickerCopy.confirm}
                </RtlCenteredText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={HebrewDatePickerCopy.cancel}
                style={styles.cancelButton}
                onPress={closePicker}>
                <RtlCenteredText style={styles.cancelButtonText}>
                  {HebrewDatePickerCopy.cancel}
                </RtlCenteredText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
