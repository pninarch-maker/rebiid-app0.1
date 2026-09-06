import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { HebrewDatePicker } from '@/src/components/HebrewDatePicker';
import { RtlText, LtrValueText } from '@/src/components/rtl';
import {
  buildPersonalReminderCalculation,
  needsAdarPolicyChoice,
  needsDayThirtyPolicyChoice,
  PERSONAL_REMINDER_HORIZON_LIMITATION_HE,
} from '@/lib/personalReminderScheduling';
import {
  PERSONAL_REMINDER_KIND_OPTIONS,
  YAHRZEIT_DISCLAIMER_HE,
  type HebrewDateAnchor,
  type HebrewMonthIdentifier,
  type PersonalReminderKind,
  type ReminderInputCalendar,
  type ReminderRecurrence,
  type YahrzeitObservancePolicy,
} from '@/lib/personalReminderTypes';
import { USE_DEFAULT_REMINDER_OFFSET, type CustomReminder } from '@/lib/settingsTypes';
import { isHebrewMonthIdentifier } from '@/lib/hebrewCalendar';

export type PersonalReminderFormStyles = {
  formBlock: object;
  inputLabel: object;
  input: object;
  multilineInput: object;
  rowDescription: object;
  optionRow: object;
  optionRowBorder: object;
  optionLabel: object;
  optionLabelSelected: object;
  checkmark: object;
  checkmarkSpacer: object;
  saveButton: object;
  saveButtonText: object;
  privacyNote: object;
  sectionHelper: object;
};

export type PersonalReminderFormValue = {
  title: string;
  message: string;
  kind: PersonalReminderKind;
  inputCalendar: ReminderInputCalendar;
  gregorianDay: string;
  gregorianMonth: string;
  gregorianYear: string;
  hebrewMonth: string;
  hebrewDay: number;
  hebrewYear?: number;
  occurredAfterSunset: boolean;
  manualEditHebrew: boolean;
  manualHebrewMonth: string;
  manualHebrewDay: number;
  manualHebrewYear?: number;
  recurrence: ReminderRecurrence;
  time: string;
  reminderOffsetMinutes: number;
  yahrzeitPolicy: YahrzeitObservancePolicy;
};

/**
 * Compact personal-form layout only — natural top-to-bottom flow.
 * Do not put flexGrow / space-between / screen-height sizing on sections.
 */
const formLayout = StyleSheet.create({
  root: {
    marginTop: 16,
    alignSelf: 'stretch',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  /** Major section stack: 20–24px between sections */
  section: {
    marginBottom: 20,
    gap: 12,
  },
  /** Label + control: 8px between label and field */
  field: {
    gap: 8,
  },
  /** Related controls within a section */
  related: {
    gap: 12,
  },
  sunsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  gregorianRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  gregorianInput: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  gregorianYearInput: {
    flexGrow: 1.4,
    flexShrink: 1,
    flexBasis: 0,
  },
  helperText: {
    marginBottom: 0,
  },
  choiceGroup: {
    gap: 0,
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  choiceOptionBorder: {
    borderBottomWidth: 1,
  },
  reviewBlock: {
    gap: 4,
  },
  saveWrap: {
    marginTop: 4,
    marginBottom: 8,
  },
});

export function createEmptyPersonalReminderForm(
  defaults?: Partial<PersonalReminderFormValue>,
): PersonalReminderFormValue {
  return {
    title: '',
    message: '',
    kind: 'birthday',
    inputCalendar: 'gregorian',
    gregorianDay: '',
    gregorianMonth: '',
    gregorianYear: '',
    hebrewMonth: 'Nisan',
    hebrewDay: 1,
    hebrewYear: undefined,
    occurredAfterSunset: false,
    manualEditHebrew: false,
    manualHebrewMonth: 'Nisan',
    manualHebrewDay: 1,
    manualHebrewYear: undefined,
    recurrence: 'annual_hebrew',
    time: '09:00',
    reminderOffsetMinutes: USE_DEFAULT_REMINDER_OFFSET,
    yahrzeitPolicy: {},
    ...defaults,
  };
}

export function personalFormFromReminder(reminder: CustomReminder): PersonalReminderFormValue {
  const g = reminder.originalGregorianDate?.isoDate?.split('-') ?? [];
  return createEmptyPersonalReminderForm({
    title: reminder.title,
    message: reminder.message,
    kind: reminder.kind ?? 'other',
    inputCalendar: reminder.inputCalendar ?? 'hebrew',
    gregorianYear: g[0] ?? '',
    gregorianMonth: g[1] ?? '',
    gregorianDay: g[2] ?? '',
    hebrewMonth: reminder.originalHebrewDate?.month ?? reminder.hebrewMonth,
    hebrewDay: reminder.originalHebrewDate?.day ?? reminder.hebrewDay,
    hebrewYear: reminder.originalHebrewDate?.year,
    occurredAfterSunset: reminder.occurredAfterSunset ?? false,
    manualEditHebrew: false,
    manualHebrewMonth: reminder.effectiveHebrewAnchor?.month ?? reminder.hebrewMonth,
    manualHebrewDay: reminder.effectiveHebrewAnchor?.day ?? reminder.hebrewDay,
    manualHebrewYear: reminder.effectiveHebrewAnchor?.year,
    recurrence: reminder.recurrence ?? 'annual_hebrew',
    time: reminder.reminderTimeLocal ?? reminder.time,
    reminderOffsetMinutes: reminder.reminderOffsetMinutes,
    yahrzeitPolicy: reminder.yahrzeitPolicy ?? {},
  });
}

function pad2(value: string): string {
  return value.padStart(2, '0');
}

function buildGregorianIso(form: PersonalReminderFormValue): string | undefined {
  if (!form.gregorianYear || !form.gregorianMonth || !form.gregorianDay) {
    return undefined;
  }
  const y = Number(form.gregorianYear);
  const m = Number(form.gregorianMonth);
  const d = Number(form.gregorianDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return undefined;
  }
  return `${y}-${pad2(String(m))}-${pad2(String(d))}`;
}

function buildHebrewAnchor(
  month: string,
  day: number,
  year?: number,
): HebrewDateAnchor | undefined {
  if (!isHebrewMonthIdentifier(month) || year == null) {
    return undefined;
  }
  return { day, month: month as HebrewMonthIdentifier, year };
}

type Props = {
  styles: PersonalReminderFormStyles;
  value: PersonalReminderFormValue;
  onChange: (next: PersonalReminderFormValue) => void;
  onSave: () => void;
  saving?: boolean;
  offsetPicker: ReactNode;
  editId?: string | null;
};

function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  styles,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T | '';
  onChange: (next: T) => void;
  styles: PersonalReminderFormStyles;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={formLayout.choiceGroup}>
      <RtlText style={[styles.inputLabel, formLayout.helperText]}>{label}</RtlText>
      {options.map((option, index) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[
              formLayout.choiceOption,
              index < options.length - 1 && formLayout.choiceOptionBorder,
              index < options.length - 1 && styles.optionRowBorder,
            ]}
            onPress={() => onChange(option.key)}>
            {selected ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <View style={styles.checkmarkSpacer} />
            )}
            {/* inRow required: bare RtlText uses width:100% and blows up horizontal rows */}
            <RtlText inRow style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
              {option.label}
            </RtlText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PersonalReminderForm({
  styles,
  value,
  onChange,
  onSave,
  saving,
  offsetPicker,
  editId,
}: Props) {
  const [showManualHebrew, setShowManualHebrew] = useState(value.manualEditHebrew);

  useEffect(() => {
    if (value.kind === 'birthday' || value.kind === 'yahrzeit') {
      if (value.recurrence !== 'annual_hebrew') {
        onChange({ ...value, recurrence: 'annual_hebrew' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to kind changes
  }, [value.kind]);

  const calculation = useMemo(() => {
    const gregorianIso = buildGregorianIso(value);
    const hebrewAnchor = buildHebrewAnchor(value.hebrewMonth, value.hebrewDay, value.hebrewYear);
    const manual = showManualHebrew
      ? buildHebrewAnchor(value.manualHebrewMonth, value.manualHebrewDay, value.manualHebrewYear)
      : null;

    return buildPersonalReminderCalculation({
      title: value.title,
      kind: value.kind,
      inputCalendar: value.inputCalendar,
      gregorianIso,
      hebrewAnchor,
      occurredAfterSunset: value.occurredAfterSunset,
      manualEffectiveHebrewAnchor: manual,
      recurrence: value.recurrence,
      reminderTimeLocal: value.time,
      yahrzeitPolicy: value.yahrzeitPolicy,
    });
  }, [showManualHebrew, value]);

  const effective = calculation.effectiveHebrewAnchor;
  const showAdarPolicy = needsAdarPolicyChoice(value.kind, effective);
  const showDay30Policy = needsDayThirtyPolicyChoice(value.kind, effective);

  return (
    <View style={formLayout.root}>
      {/* Identity */}
      <View style={formLayout.section}>
        <View style={formLayout.field}>
          <RtlText style={[styles.inputLabel, formLayout.helperText]}>שם התזכורת</RtlText>
          <TextInput
            style={styles.input}
            value={value.title}
            onChangeText={(text) => onChange({ ...value, title: text })}
            placeholder="לדוגמה: יום ההולדת של יעקב"
            textAlign="right"
            maxLength={120}
            accessibilityLabel="שם התזכורת"
          />
        </View>

        <View style={formLayout.field}>
          <RtlText style={[styles.inputLabel, formLayout.helperText]}>הודעה (אופציונלי)</RtlText>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={value.message}
            onChangeText={(text) => onChange({ ...value, message: text })}
            multiline
            textAlign="right"
            maxLength={500}
            accessibilityLabel="הודעת התזכורת"
          />
        </View>

        <ChoiceRow
          label="סוג התזכורת"
          styles={styles}
          value={value.kind}
          options={PERSONAL_REMINDER_KIND_OPTIONS}
          onChange={(kind) => onChange({ ...value, kind })}
        />
      </View>

      {/* Date entry */}
      <View style={formLayout.section}>
        <ChoiceRow
          label="לוח להזנת התאריך"
          styles={styles}
          value={value.inputCalendar}
          options={[
            { key: 'hebrew', label: 'תאריך עברי' },
            { key: 'gregorian', label: 'תאריך לועזי' },
          ]}
          onChange={(inputCalendar) => onChange({ ...value, inputCalendar })}
        />

        {value.inputCalendar === 'gregorian' ? (
          <View style={formLayout.field}>
            <RtlText style={[styles.inputLabel, formLayout.helperText]}>
              תאריך לועזי (יום / חודש / שנה)
            </RtlText>
            <View style={formLayout.gregorianRow}>
              <TextInput
                style={[styles.input, formLayout.gregorianInput]}
                value={value.gregorianDay}
                onChangeText={(text) =>
                  onChange({ ...value, gregorianDay: text.replace(/\D/g, '') })
                }
                keyboardType="number-pad"
                placeholder="יום"
                accessibilityLabel="יום לועזי"
                textAlign="right"
              />
              <TextInput
                style={[styles.input, formLayout.gregorianInput]}
                value={value.gregorianMonth}
                onChangeText={(text) =>
                  onChange({ ...value, gregorianMonth: text.replace(/\D/g, '') })
                }
                keyboardType="number-pad"
                placeholder="חודש"
                accessibilityLabel="חודש לועזי"
                textAlign="right"
              />
              <TextInput
                style={[styles.input, formLayout.gregorianYearInput]}
                value={value.gregorianYear}
                onChangeText={(text) =>
                  onChange({ ...value, gregorianYear: text.replace(/\D/g, '') })
                }
                keyboardType="number-pad"
                placeholder="שנה"
                accessibilityLabel="שנה לועזית"
                textAlign="right"
              />
            </View>
          </View>
        ) : (
          <HebrewDatePicker
            includeYear
            value={{
              hebrewMonth: value.hebrewMonth,
              hebrewDay: value.hebrewDay,
              hebrewYear: value.hebrewYear,
            }}
            onChange={(next) =>
              onChange({
                ...value,
                hebrewMonth: next.hebrewMonth,
                hebrewDay: next.hebrewDay,
                hebrewYear: next.hebrewYear,
              })
            }
          />
        )}

        <View style={formLayout.related}>
          <View style={formLayout.sunsetRow}>
            <Switch
              value={value.occurredAfterSunset}
              onValueChange={(occurredAfterSunset) => onChange({ ...value, occurredAfterSunset })}
              accessibilityLabel="האירוע היה לאחר השקיעה"
            />
            <RtlText inRow style={[styles.inputLabel, formLayout.helperText]}>
              האירוע היה לאחר השקיעה
            </RtlText>
          </View>
          <RtlText style={[styles.sectionHelper, formLayout.helperText]}>
            אם מסומן — התאריך העברי האפקטיבי הוא היום העברי הבא. לא מחשבים שקיעה אוטומטית.
          </RtlText>
        </View>

        <View style={formLayout.related}>
          {calculation.explanationLines.map((line) => (
            <RtlText key={line} style={[styles.privacyNote, formLayout.helperText]}>
              {line}
            </RtlText>
          ))}
          {calculation.yahrzeitRuleNote ? (
            <RtlText style={[styles.sectionHelper, formLayout.helperText]}>
              {calculation.yahrzeitRuleNote}
            </RtlText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="עריכה ידנית של התאריך העברי"
            onPress={() => {
              setShowManualHebrew((current) => !current);
              if (!showManualHebrew && calculation.effectiveHebrewAnchor) {
                onChange({
                  ...value,
                  manualEditHebrew: true,
                  manualHebrewMonth: calculation.effectiveHebrewAnchor.month,
                  manualHebrewDay: calculation.effectiveHebrewAnchor.day,
                  manualHebrewYear: calculation.effectiveHebrewAnchor.year,
                });
              } else {
                onChange({ ...value, manualEditHebrew: false });
              }
            }}>
            <RtlText style={styles.rowDescription}>עריכה ידנית של התאריך העברי</RtlText>
          </Pressable>
          {showManualHebrew ? (
            <HebrewDatePicker
              includeYear
              value={{
                hebrewMonth: value.manualHebrewMonth,
                hebrewDay: value.manualHebrewDay,
                hebrewYear: value.manualHebrewYear,
              }}
              onChange={(next) =>
                onChange({
                  ...value,
                  manualEditHebrew: true,
                  manualHebrewMonth: next.hebrewMonth,
                  manualHebrewDay: next.hebrewDay,
                  manualHebrewYear: next.hebrewYear,
                })
              }
            />
          ) : null}
        </View>
      </View>

      {/* Policies / recurrence */}
      <View style={formLayout.section}>
        {value.kind === 'yahrzeit' ? (
          <RtlText style={[styles.sectionHelper, formLayout.helperText]}>
            {YAHRZEIT_DISCLAIMER_HE}
          </RtlText>
        ) : null}

        {showAdarPolicy ? (
          <ChoiceRow
            label="מנהג אדר בשנה מעוברת"
            styles={styles}
            value={value.yahrzeitPolicy.adarInLeapYear ?? ''}
            options={[
              { key: 'adar_i', label: 'אדר א׳' },
              { key: 'adar_ii', label: 'אדר ב׳' },
              { key: 'both', label: 'שני האדרים' },
            ]}
            onChange={(adarInLeapYear) =>
              onChange({
                ...value,
                yahrzeitPolicy: { ...value.yahrzeitPolicy, adarInLeapYear },
              })
            }
          />
        ) : null}

        {showDay30Policy ? (
          <ChoiceRow
            label="כשאין יום ל׳ בחודש"
            styles={styles}
            value={value.yahrzeitPolicy.missingDayThirty ?? ''}
            options={[
              { key: 'day_29', label: 'כ״ט בחודש' },
              { key: 'first_of_next_month', label: 'א׳ בחודש הבא' },
              { key: 'both', label: 'שני המועדים' },
            ]}
            onChange={(missingDayThirty) =>
              onChange({
                ...value,
                yahrzeitPolicy: { ...value.yahrzeitPolicy, missingDayThirty },
              })
            }
          />
        ) : null}

        <ChoiceRow
          label="חזרתיות"
          styles={styles}
          value={value.recurrence}
          options={
            value.kind === 'other'
              ? [
                  { key: 'annual_hebrew', label: 'כל שנה לפי העברי' },
                  { key: 'once', label: 'חד־פעמי' },
                ]
              : [{ key: 'annual_hebrew', label: 'כל שנה לפי העברי' }]
          }
          onChange={(recurrence) => onChange({ ...value, recurrence })}
        />
      </View>

      {/* Time */}
      <View style={formLayout.section}>
        <View style={formLayout.field}>
          <RtlText style={[styles.inputLabel, formLayout.helperText]}>שעת התזכורת</RtlText>
          <TextInput
            style={styles.input}
            value={value.time}
            onChangeText={(text) => onChange({ ...value, time: text })}
            placeholder="09:00"
            accessibilityLabel="שעת התזכורת"
            textAlign="right"
            maxLength={5}
          />
          <LtrValueText style={styles.rowDescription}>{value.time || '—'}</LtrValueText>
        </View>

        <View style={formLayout.field}>
          <RtlText style={[styles.inputLabel, formLayout.helperText]}>מתי להזכיר?</RtlText>
          {offsetPicker}
        </View>
      </View>

      {/* Review + save */}
      <View style={[formLayout.section, { marginBottom: 0 }]}>
        {calculation.errors.length > 0 ? (
          <View style={formLayout.reviewBlock}>
            {calculation.errors.map((error) => (
              <RtlText key={error.code} style={[styles.sectionHelper, formLayout.helperText]}>
                {error.messageHe}
              </RtlText>
            ))}
          </View>
        ) : (
          <View style={formLayout.reviewBlock}>
            <RtlText style={[styles.privacyNote, formLayout.helperText]}>סיכום לפני שמירה</RtlText>
            {calculation.explanationLines.map((line) => (
              <RtlText key={`review-${line}`} style={styles.rowDescription}>
                {line}
              </RtlText>
            ))}
            <RtlText style={[styles.sectionHelper, formLayout.helperText]}>
              {PERSONAL_REMINDER_HORIZON_LIMITATION_HE}
            </RtlText>
          </View>
        )}

        <View style={formLayout.saveWrap}>
          <Pressable
            style={styles.saveButton}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={editId ? 'עדכון תזכורת אישית' : 'שמירת תזכורת אישית'}
            onPress={onSave}>
            <RtlText style={styles.saveButtonText}>
              {editId ? 'עדכון תזכורת' : 'שמירת תזכורת'}
            </RtlText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function draftInputFromForm(value: PersonalReminderFormValue) {
  return {
    title: value.title,
    kind: value.kind,
    inputCalendar: value.inputCalendar,
    gregorianIso: buildGregorianIso(value),
    hebrewAnchor: buildHebrewAnchor(value.hebrewMonth, value.hebrewDay, value.hebrewYear),
    occurredAfterSunset: value.occurredAfterSunset,
    manualEffectiveHebrewAnchor: value.manualEditHebrew
      ? buildHebrewAnchor(value.manualHebrewMonth, value.manualHebrewDay, value.manualHebrewYear)
      : null,
    recurrence: value.recurrence,
    reminderTimeLocal: value.time,
    yahrzeitPolicy: value.yahrzeitPolicy,
  };
}
