import { Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/layout';
import { ButtonCopy, SettingsCopy } from '@/lib/rebiidCopy';
import type { NotificationCategoryDefinition } from '@/lib/notificationCategories';
import {
  ADVANCE_REMINDER_OPTIONS,
  DELIVERY_MODE_OPTIONS,
} from '@/lib/notificationCategoryPrefs';
import type { NotificationCategoryPreference } from '@/lib/settingsTypes';
import { RtlCenteredText, RtlText } from '@/src/components/rtl';
import { createNotificationCategorySheetStyles } from '@/src/theme/notificationSheetStyles';
import { useTheme, useThemeStyles } from '@/src/theme/useTheme';

interface NotificationCategorySheetProps {
  visible: boolean;
  definition: NotificationCategoryDefinition | null;
  preference: NotificationCategoryPreference | null;
  onChange: (preference: NotificationCategoryPreference) => void;
  onClose: () => void;
}

type SheetStyles = ReturnType<typeof createNotificationCategorySheetStyles>;

function OptionRow({
  label,
  selected,
  onPress,
  isLast = false,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
  styles: SheetStyles;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.optionRow, !isLast && styles.optionRowBorder]}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <RtlText inRow style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
        {label}
      </RtlText>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  isLast = false,
  styles,
  switchTrack,
  switchThumb,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  isLast?: boolean;
  styles: SheetStyles;
  switchTrack: { false: string; true: string };
  switchThumb: string;
}) {
  return (
    <View style={[styles.toggleRow, !isLast && styles.optionRowBorder]}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={switchTrack}
        thumbColor={switchThumb}
      />
      <RtlText inRow style={styles.toggleLabel}>
        {label}
      </RtlText>
    </View>
  );
}

export function NotificationCategorySheet({
  visible,
  definition,
  preference,
  onChange,
  onClose,
}: NotificationCategorySheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemeStyles(createNotificationCategorySheetStyles);

  if (!definition || !preference) {
    return null;
  }

  const knowledgeOnly = definition.knowledgeOnly === true;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={ButtonCopy.close} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <View style={styles.handle} />
          <RtlText variant="heading" style={styles.title}>
            {definition.title}
          </RtlText>
          <RtlText style={styles.subtitle}>{definition.description}</RtlText>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {!knowledgeOnly ? (
              <>
                <RtlText style={styles.sectionLabel}>{SettingsCopy.notificationTypeTitle}</RtlText>
                <View style={styles.group}>
                  {DELIVERY_MODE_OPTIONS.map((option, index) => (
                    <OptionRow
                      key={option.key}
                      label={option.label}
                      selected={preference.deliveryMode === option.key}
                      isLast={index === DELIVERY_MODE_OPTIONS.length - 1}
                      styles={styles}
                      onPress={() => onChange({ ...preference, deliveryMode: option.key })}
                    />
                  ))}
                </View>

                <View style={styles.group}>
                  <ToggleRow
                    label={SettingsCopy.vibrationEnabled}
                    value={preference.vibrationEnabled}
                    styles={styles}
                    switchTrack={theme.surfaces.switchTrack}
                    switchThumb={theme.surfaces.switchThumb(preference.vibrationEnabled)}
                    onValueChange={(vibrationEnabled) => onChange({ ...preference, vibrationEnabled })}
                    isLast
                  />
                </View>

                <RtlText style={styles.sectionLabel}>{SettingsCopy.advanceReminderTitle}</RtlText>
                <View style={styles.group}>
                  {ADVANCE_REMINDER_OPTIONS.map((option, index) => (
                    <OptionRow
                      key={option.key}
                      label={option.label}
                      selected={preference.advanceReminderMinutes === option.key}
                      isLast={index === ADVANCE_REMINDER_OPTIONS.length - 1}
                      styles={styles}
                      onPress={() => onChange({ ...preference, advanceReminderMinutes: option.key })}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <RtlText style={styles.sectionLabel}>{SettingsCopy.homeScreenTitle}</RtlText>
            <View style={styles.group}>
              <OptionRow
                label={SettingsCopy.homeScreenYes}
                selected={preference.showOnHome}
                styles={styles}
                onPress={() => onChange({ ...preference, showOnHome: true })}
              />
              <OptionRow
                label={SettingsCopy.homeScreenNo}
                selected={!preference.showOnHome}
                isLast
                styles={styles}
                onPress={() => onChange({ ...preference, showOnHome: false })}
              />
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            onPress={onClose}>
            <RtlCenteredText style={styles.saveButtonText}>{ButtonCopy.save}</RtlCenteredText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
