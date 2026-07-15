import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useAppearancePreference } from '@/hooks/useAppearancePreference';
import { APP_META } from '@/lib/appInfo';
import { getCityByKey } from '@/lib/cities';
import { openEmailAddress } from '@/lib/contactLinks';
import { rescheduleNotificationsAfterSettingsChange, enableNotifications, disableNotifications, scheduleTestNotification } from '@/lib/notifications';
import {
  ButtonCopy,
  EmptyCopy,
  ErrorCopy,
  SettingsCopy,
  SuccessCopy,
  REBIID,
  AccessibilityCopy,
} from '@/lib/rebiidCopy';
import {
  createCustomReminderId,
  getAppSettings,
  loadReminderEngineSettings,
  saveAppSettings,
  saveCustomReminders,
} from '@/lib/settings';
import { MINHAG_SEGULAH_TEMPLATES } from '@/lib/minhagSegulahTemplates';
import { APPEARANCE_PREFERENCE_OPTIONS } from '@/lib/appearancePreference';
import {
  ADDRESS_GENDER_OPTIONS,
  CANDLE_LIGHTING_PRESETS,
  USE_DEFAULT_REMINDER_OFFSET,
  type AddressGender,
  type AppearancePreference,
  type AppSettings,
  type CustomReminder,
  type CustomReminderCategory,
} from '@/lib/settingsTypes';
import { NotificationCategoriesSection } from '@/src/components/NotificationCategoriesSection';
import { CityPickerField } from '@/src/components/CityPickerField';
import { HebrewDatePicker } from '@/src/components/HebrewDatePicker';
import {
  createSettingsStyles,
  type SettingsScreenStyles,
} from '@/src/theme/settingsScreenStyles';
import { useTheme, useThemeStyles } from '@/src/theme/useTheme';
import { formatHebrewCustomDateWithTime } from '@/lib/hebrewMonths';

type OffsetPresetKey = 'default' | 'at_time' | '10' | '30' | '60' | '1440' | 'custom';

function minutesToPresetKey(minutes: number, allowDefault: boolean): OffsetPresetKey {
  if (allowDefault && minutes === USE_DEFAULT_REMINDER_OFFSET) {
    return 'default';
  }
  if (minutes === 0) return 'at_time';
  if (minutes === 10) return '10';
  if (minutes === 30) return '30';
  if (minutes === 60) return '60';
  if (minutes === 1440) return '1440';
  return 'custom';
}

function presetKeyToMinutes(key: OffsetPresetKey, customValue: string): number {
  switch (key) {
    case 'default':
      return USE_DEFAULT_REMINDER_OFFSET;
    case 'at_time':
      return 0;
    case '10':
      return 10;
    case '30':
      return 30;
    case '60':
      return 60;
    case '1440':
      return 1440;
    case 'custom':
      return Math.max(0, Number.parseInt(customValue, 10) || 0);
    default:
      return 0;
  }
}

const OFFSET_OPTIONS: { key: OffsetPresetKey; label: string; allowDefault?: boolean }[] = [
  { key: 'default', label: 'השתמש בברירת המחדל', allowDefault: true },
  { key: 'at_time', label: 'בזמן האירוע' },
  { key: '10', label: '10 דקות לפני' },
  { key: '30', label: '30 דקות לפני' },
  { key: '60', label: 'שעה לפני' },
  { key: '1440', label: 'יום לפני' },
  { key: 'custom', label: 'מותאם אישית' },
];

const DEFAULT_OFFSET_OPTIONS = OFFSET_OPTIONS.filter((option) => !option.allowDefault);

function OffsetPicker({
  value,
  customValue,
  onChange,
  allowDefault = false,
  customLabel,
  styles,
}: {
  value: number;
  customValue: string;
  onChange: (minutes: number, customText: string) => void;
  allowDefault?: boolean;
  customLabel: string;
  styles: SettingsScreenStyles;
}) {
  const preset = minutesToPresetKey(value, allowDefault);
  const options = allowDefault ? OFFSET_OPTIONS : DEFAULT_OFFSET_OPTIONS;

  return (
    <View style={styles.nestedBlock}>
      {options.map((option, index) => {
        const selected = preset === option.key;

        return (
          <Pressable
            key={option.key}
            style={[
              styles.optionRow,
              index < options.length - 1 && styles.optionRowBorder,
            ]}
            onPress={() => onChange(presetKeyToMinutes(option.key, customValue), customValue)}>
            <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
              {option.label}
            </Text>
            {selected ? <Text style={styles.checkmark}>✓</Text> : null}
          </Pressable>
        );
      })}
      {preset === 'custom' ? (
        <View style={styles.customInputBlock}>
          <Text style={styles.inputLabel}>{customLabel}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={customValue}
            onChangeText={(text) => onChange(presetKeyToMinutes('custom', text), text)}
            placeholder="0"
            textAlign="right"
          />
        </View>
      ) : null}
    </View>
  );
}

const EMPTY_FORM: Omit<CustomReminder, 'id'> = {
  title: '',
  message: '',
  hebrewMonth: 'Nisan',
  hebrewDay: 1,
  time: '09:00',
  enabled: true,
  reminderOffsetMinutes: USE_DEFAULT_REMINDER_OFFSET,
  category: 'personal',
};

function emptyFormForCategory(category: CustomReminderCategory): Omit<CustomReminder, 'id'> {
  return { ...EMPTY_FORM, category };
}

export default function SettingsScreen() {
  const { horizontalPadding } = useScreenLayout();
  const theme = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const { appearancePreference, setAppearancePreference } = useAppearancePreference();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [customCandleMinutes, setCustomCandleMinutes] = useState('40');
  const [customReminderOffset, setCustomReminderOffset] = useState('30');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState(EMPTY_FORM);
  const [showMinhagForm, setShowMinhagForm] = useState(false);
  const [minhagForm, setMinhagForm] = useState(() => emptyFormForCategory('minhag_segulah'));
  const [minhagCustomOffset, setMinhagCustomOffset] = useState('30');
  const [testingNotification, setTestingNotification] = useState(false);

  const candlePreset = useMemo(() => {
    if (!settings) return 'custom';
    return CANDLE_LIGHTING_PRESETS.includes(
      settings.candleLightingOffsetMinutes as (typeof CANDLE_LIGHTING_PRESETS)[number],
    )
      ? String(settings.candleLightingOffsetMinutes)
      : 'custom';
  }, [settings]);

  const personalReminders = useMemo(
    () =>
      settings?.customReminders.filter((item) => (item.category ?? 'personal') === 'personal') ??
      [],
    [settings],
  );

  const minhagReminders = useMemo(
    () => settings?.customReminders.filter((item) => item.category === 'minhag_segulah') ?? [],
    [settings],
  );

  const minhagCategoryEnabled =
    settings?.notificationCategoryPreferences.minhag_segulah.enabled === true &&
    settings.notificationCategoryPreferences.minhag_segulah.deliveryMode !== 'disabled';

  useEffect(() => {
    Promise.all([getAppSettings(), loadReminderEngineSettings()])
      .then(([loaded]) => {
        setSettings(loaded);
        setCustomCandleMinutes(String(loaded.candleLightingOffsetMinutes));
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSettings = useCallback(async (next: AppSettings) => {
    setSyncing(true);
    setSettings(next);
    try {
      await saveAppSettings(next);
      await loadReminderEngineSettings();
      await rescheduleNotificationsAfterSettingsChange();
    } catch {
      Alert.alert('רגע', ErrorCopy.storage);
      const refreshed = await getAppSettings();
      setSettings(refreshed);
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleSelectCity = useCallback(
    async (cityName: string) => {
      if (!settings || settings.city === cityName) {
        return;
      }

      const city = getCityByKey(cityName);
      if (!city) {
        Alert.alert('רגע', ErrorCopy.cityUpdate);
        return;
      }

      await persistSettings({
        ...settings,
        city: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      });
    },
    [persistSettings, settings],
  );

  const handleCandlePreset = useCallback(
    async (preset: string) => {
      if (!settings) {
        return;
      }

      if (preset === 'custom') {
        await persistSettings({
          ...settings,
          candleLightingOffsetMinutes: Number.parseInt(customCandleMinutes, 10) || 40,
        });
        return;
      }

      await persistSettings({
        ...settings,
        candleLightingOffsetMinutes: Number.parseInt(preset, 10),
      });
    },
    [customCandleMinutes, persistSettings, settings],
  );

  const handleCustomCandleChange = useCallback(
    async (text: string) => {
      setCustomCandleMinutes(text);
      if (!settings) {
        return;
      }

      const minutes = Number.parseInt(text, 10);
      if (!Number.isFinite(minutes) || minutes <= 0) {
        return;
      }

      await persistSettings({ ...settings, candleLightingOffsetMinutes: minutes });
    },
    [persistSettings, settings],
  );

  const handleHavdalah = useCallback(
    async (method: 'regular' | 'rabbeinu_tam') => {
      if (!settings || settings.havdalahMethod === method) {
        return;
      }

      await persistSettings({ ...settings, havdalahMethod: method });
    },
    [persistSettings, settings],
  );

  const handleAddressGender = useCallback(
    async (gender: AddressGender) => {
      if (!settings || settings.addressGender === gender) {
        return;
      }

      await persistSettings({ ...settings, addressGender: gender });
    },
    [persistSettings, settings],
  );

  const handleAppearancePreference = useCallback(
    async (preference: AppearancePreference) => {
      if (!settings || appearancePreference === preference) {
        return;
      }

      setSyncing(true);
      try {
        await setAppearancePreference(preference);
        setSettings({ ...settings, appearancePreference: preference });
      } catch {
        Alert.alert('רגע', ErrorCopy.storage);
      } finally {
        setSyncing(false);
      }
    },
    [appearancePreference, setAppearancePreference, settings],
  );

  const handleNotificationsToggle = useCallback(
    async (enabled: boolean) => {
      if (!settings) {
        return;
      }

      setSyncing(true);

      if (enabled) {
        await saveAppSettings({ ...settings, notificationsEnabled: true });
        const success = await enableNotifications();

        if (!success) {
          await saveAppSettings({ ...settings, notificationsEnabled: false });
          setSettings({ ...settings, notificationsEnabled: false });
          Alert.alert('הרשאות', EmptyCopy.notificationsPermission);
          setSyncing(false);
          return;
        }

        const refreshed = await getAppSettings();
        setSettings(refreshed);
        setSyncing(false);
        return;
      }

      await disableNotifications();
      await saveAppSettings({ ...settings, notificationsEnabled: false });
      const refreshed = await getAppSettings();
      setSettings(refreshed);
      setSyncing(false);
    },
    [settings],
  );

  const handleUpdateNotificationPreferences = useCallback(
    async (
      preferences: AppSettings['notificationCategoryPreferences'],
      options?: { reschedule?: boolean; notificationSound?: AppSettings['notificationSound'] },
    ) => {
      if (!settings) {
        return;
      }

      const nextSettings: AppSettings = {
        ...settings,
        notificationCategoryPreferences: preferences,
      };

      if (options?.notificationSound) {
        nextSettings.notificationSound = options.notificationSound;
        nextSettings.notificationSoundEnabled = options.notificationSound !== 'silent';
      }

      await persistSettings(nextSettings);
      await loadReminderEngineSettings();
    },
    [persistSettings, settings],
  );

  const handleTestNotification = useCallback(async () => {
    setTestingNotification(true);
    try {
      const success = await scheduleTestNotification();
      if (success) {
        Alert.alert('REBIID', SuccessCopy.testNotification);
        return;
      }
      Alert.alert('רגע', EmptyCopy.notificationsPermission);
    } catch {
      Alert.alert('רגע', ErrorCopy.notificationScheduling);
    } finally {
      setTestingNotification(false);
    }
  }, []);

  const handleSaveCustomReminder = useCallback(async () => {
    if (!settings || !reminderForm.title.trim()) {
      Alert.alert('רגע', ErrorCopy.missingTitle);
      return;
    }

    const reminder: CustomReminder = {
      id: createCustomReminderId(),
      ...reminderForm,
      title: reminderForm.title.trim(),
      message: reminderForm.message.trim(),
      category: 'personal',
    };

    const nextReminders = [...settings.customReminders, reminder];
    setSyncing(true);
    try {
      await saveCustomReminders(nextReminders);
      const refreshed = await getAppSettings();
      setSettings(refreshed);
      await loadReminderEngineSettings();
      await rescheduleNotificationsAfterSettingsChange();
      setReminderForm(EMPTY_FORM);
      setShowReminderForm(false);
    } catch {
      Alert.alert('רגע', ErrorCopy.storage);
    } finally {
      setSyncing(false);
    }
  }, [reminderForm, settings]);

  const handleSaveMinhagReminder = useCallback(async () => {
    if (!settings || !minhagForm.title.trim()) {
      Alert.alert('רגע', ErrorCopy.missingTitle);
      return;
    }

    const reminder: CustomReminder = {
      id: createCustomReminderId(),
      ...minhagForm,
      title: minhagForm.title.trim(),
      message: minhagForm.message.trim(),
      category: 'minhag_segulah',
    };

    const nextReminders = [...settings.customReminders, reminder];
    setSyncing(true);
    try {
      await saveCustomReminders(nextReminders);
      const refreshed = await getAppSettings();
      setSettings(refreshed);
      await loadReminderEngineSettings();
      await rescheduleNotificationsAfterSettingsChange();
      setMinhagForm(emptyFormForCategory('minhag_segulah'));
      setShowMinhagForm(false);
    } catch {
      Alert.alert('רגע', ErrorCopy.storage);
    } finally {
      setSyncing(false);
    }
  }, [minhagForm, settings]);

  const handleApplyMinhagTemplate = useCallback((title: string, message: string) => {
    setMinhagForm((current) => ({
      ...current,
      title,
      message,
      category: 'minhag_segulah',
    }));
    setShowMinhagForm(true);
  }, []);

  const handleDeleteCustomReminder = useCallback(
    async (id: string) => {
      if (!settings) {
        return;
      }

      const nextReminders = settings.customReminders.filter((item) => item.id !== id);
      setSyncing(true);
      try {
        await saveCustomReminders(nextReminders);
        const refreshed = await getAppSettings();
        setSettings(refreshed);
        await loadReminderEngineSettings();
        await rescheduleNotificationsAfterSettingsChange();
      } catch {
        Alert.alert('רגע', ErrorCopy.storage);
      } finally {
        setSyncing(false);
      }
    },
    [settings],
  );

  const handleToggleCustomReminder = useCallback(
    async (id: string, enabled: boolean) => {
      if (!settings) {
        return;
      }

      const nextReminders = settings.customReminders.map((item) =>
        item.id === id ? { ...item, enabled } : item,
      );
      setSyncing(true);
      try {
        await saveCustomReminders(nextReminders);
        const refreshed = await getAppSettings();
        setSettings(refreshed);
        await loadReminderEngineSettings();
        await rescheduleNotificationsAfterSettingsChange();
      } catch {
        Alert.alert('רגע', ErrorCopy.storage);
      } finally {
        setSyncing(false);
      }
    },
    [settings],
  );

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.screenSafeArea} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenSafeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{SettingsCopy.title}</Text>
          {syncing ? <ActivityIndicator color={theme.colors.primary} /> : null}
        </View>

        <Text style={styles.intro}>{SettingsCopy.intro}</Text>

        <Text style={styles.sectionTitle}>{SettingsCopy.addressTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.addressHelper}</Text>
        <View style={styles.card}>
          {ADDRESS_GENDER_OPTIONS.map((option, index) => {
            const selected = settings.addressGender === option.key;

            return (
              <Pressable
                key={option.key}
                style={[
                  styles.optionRow,
                  index < ADDRESS_GENDER_OPTIONS.length - 1 && styles.optionRowBorder,
                ]}
                onPress={() => handleAddressGender(option.key)}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {selected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.cityTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.cityHelper}</Text>
        <CityPickerField
          selectedCity={settings.city}
          onSelect={(cityName) => void handleSelectCity(cityName)}
        />

        <Text style={styles.sectionTitle}>{SettingsCopy.candleTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.candleHelper}</Text>
        <View style={styles.card}>
          {[...CANDLE_LIGHTING_PRESETS.map(String), 'custom'].map((preset, index, arr) => {
            const selected = candlePreset === preset;
            const label =
              preset === 'custom'
                ? 'מותאם אישי'
                : `${preset} דקות לפני שקיעה`;

            return (
              <Pressable
                key={preset}
                style={[
                  styles.optionRow,
                  index < arr.length - 1 && styles.optionRowBorder,
                ]}
                onPress={() => handleCandlePreset(preset)}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {label}
                </Text>
                {selected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}
          {candlePreset === 'custom' ? (
            <View style={styles.customInputBlock}>
              <Text style={styles.inputLabel}>כמה דקות לפני שקיעה?</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={customCandleMinutes}
                onChangeText={handleCustomCandleChange}
                textAlign="right"
              />
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.havdalahTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.havdalahHelper}</Text>
        <View style={styles.card}>
          <Pressable
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={() => handleHavdalah('regular')}>
            <Text
              style={[
                styles.optionLabel,
                settings.havdalahMethod === 'regular' && styles.optionLabelSelected,
              ]}>
              {SettingsCopy.havdalahRegular}
            </Text>
            {settings.havdalahMethod === 'regular' ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
          </Pressable>
          <Pressable style={styles.optionRow} onPress={() => handleHavdalah('rabbeinu_tam')}>
            <Text
              style={[
                styles.optionLabel,
                settings.havdalahMethod === 'rabbeinu_tam' && styles.optionLabelSelected,
              ]}>
              {SettingsCopy.havdalahRabbeinuTam}
            </Text>
            {settings.havdalahMethod === 'rabbeinu_tam' ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.notificationsTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.notificationsHelper}</Text>
        <Text style={styles.privacyNote}>{SettingsCopy.notificationsPrivacyNote}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>{SettingsCopy.notificationsToggle}</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={theme.surfaces.switchTrack}
              thumbColor={theme.surfaces.switchThumb(settings.notificationsEnabled)}
            />
          </View>
          <Pressable
            style={styles.testButton}
            onPress={handleTestNotification}
            disabled={testingNotification || syncing}>
            {testingNotification ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={styles.testButtonText}>{ButtonCopy.testNotification}</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.sectionHelper}>{SettingsCopy.notificationsCategoriesHelper}</Text>
        <NotificationCategoriesSection
          settings={settings}
          onUpdatePreferences={handleUpdateNotificationPreferences}
        />

        <Text style={styles.sectionTitle}>{SettingsCopy.minhagSegulahTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.minhagSegulahHelper}</Text>
        {minhagCategoryEnabled ? (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>{SettingsCopy.minhagSegulahTemplatesTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
              {MINHAG_SEGULAH_TEMPLATES.map((template) => (
                <Pressable
                  key={template.id}
                  style={styles.monthChip}
                  onPress={() => handleApplyMinhagTemplate(template.title, template.message)}>
                  <Text style={styles.monthChipText}>{template.title}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, styles.minhagCustomTitle]}>
              {SettingsCopy.minhagSegulahCustomTitle}
            </Text>
            {minhagReminders.length === 0 ? (
              <Text style={styles.emptyText}>{EmptyCopy.personalReminders}</Text>
            ) : (
              minhagReminders.map((reminder, index) => (
                <View
                  key={reminder.id}
                  style={[
                    styles.reminderItem,
                    index < minhagReminders.length - 1 && styles.optionRowBorder,
                  ]}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{reminder.title}</Text>
                      <Text style={styles.rowDescription}>
                        {formatHebrewCustomDateWithTime(
                          reminder.hebrewDay,
                          reminder.hebrewMonth,
                          reminder.time,
                        )}
                      </Text>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(value) => handleToggleCustomReminder(reminder.id, value)}
                      trackColor={theme.surfaces.switchTrack}
                      thumbColor={theme.surfaces.switchThumb(reminder.enabled)}
                    />
                  </View>
                  <Text style={styles.rowDescription}>{reminder.message}</Text>
                  <Pressable onPress={() => handleDeleteCustomReminder(reminder.id)}>
                    <Text style={styles.deleteText}>מחק תזכורת</Text>
                  </Pressable>
                </View>
              ))
            )}

            <Pressable
              style={styles.addButton}
              onPress={() => setShowMinhagForm((current) => !current)}>
              <Text style={styles.addButtonText}>
                {showMinhagForm ? ButtonCopy.closeForm : SettingsCopy.addMinhagReminder}
              </Text>
            </Pressable>

            {showMinhagForm ? (
              <View style={styles.formBlock}>
                <Text style={styles.inputLabel}>כותרת</Text>
                <TextInput
                  style={styles.input}
                  value={minhagForm.title}
                  onChangeText={(text) => setMinhagForm((current) => ({ ...current, title: text }))}
                  textAlign="right"
                />
                <Text style={styles.inputLabel}>הודעה</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={minhagForm.message}
                  onChangeText={(text) =>
                    setMinhagForm((current) => ({ ...current, message: text }))
                  }
                  multiline
                  textAlign="right"
                />
                <HebrewDatePicker
                  value={{
                    hebrewMonth: minhagForm.hebrewMonth,
                    hebrewDay: minhagForm.hebrewDay,
                  }}
                  onChange={(next) =>
                    setMinhagForm((current) => ({
                      ...current,
                      hebrewMonth: next.hebrewMonth,
                      hebrewDay: next.hebrewDay,
                    }))
                  }
                />
                <Text style={styles.inputLabel}>שעה (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={minhagForm.time}
                  onChangeText={(text) => setMinhagForm((current) => ({ ...current, time: text }))}
                  placeholder="09:00"
                  textAlign="right"
                />
                <Text style={styles.inputLabel}>מתי להזכיר?</Text>
                <OffsetPicker
                  allowDefault
                  styles={styles}
                  value={minhagForm.reminderOffsetMinutes}
                  customValue={minhagCustomOffset}
                  customLabel="כמה דקות לפני התזכורת?"
                  onChange={(minutes, customText) => {
                    setMinhagCustomOffset(customText);
                    setMinhagForm((current) => ({
                      ...current,
                      reminderOffsetMinutes: minutes,
                    }));
                  }}
                />
                <Pressable style={styles.saveButton} onPress={handleSaveMinhagReminder}>
                  <Text style={styles.saveButtonText}>{ButtonCopy.save}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.sectionHelper}>
            הפעילו את קטגוריית «מנהגים וסגולות» בחלק ההתראות כדי להוסיף תזכורות מותאמות.
          </Text>
        )}

        <Text style={styles.sectionTitle}>{SettingsCopy.personalTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.personalHelper}</Text>
        <View style={styles.card}>
          {personalReminders.length === 0 ? (
            <Text style={styles.emptyText}>{EmptyCopy.personalReminders}</Text>
          ) : (
            personalReminders.map((reminder, index) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderItem,
                  index < personalReminders.length - 1 && styles.optionRowBorder,
                ]}>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{reminder.title}</Text>
                    <Text style={styles.rowDescription}>
                      {formatHebrewCustomDateWithTime(
                        reminder.hebrewDay,
                        reminder.hebrewMonth,
                        reminder.time,
                      )}
                    </Text>
                  </View>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={(value) => handleToggleCustomReminder(reminder.id, value)}
                    trackColor={theme.surfaces.switchTrack}
                    thumbColor={theme.surfaces.switchThumb(reminder.enabled)}
                  />
                </View>
                <Text style={styles.rowDescription}>{reminder.message}</Text>
                <Pressable onPress={() => handleDeleteCustomReminder(reminder.id)}>
                  <Text style={styles.deleteText}>מחק תזכורת</Text>
                </Pressable>
              </View>
            ))
          )}

          <Pressable
            style={styles.addButton}
            onPress={() => setShowReminderForm((current) => !current)}>
            <Text style={styles.addButtonText}>
              {showReminderForm ? ButtonCopy.closeForm : ButtonCopy.addPersonalReminder}
            </Text>
          </Pressable>

          {showReminderForm ? (
            <View style={styles.formBlock}>
              <Text style={styles.inputLabel}>כותרת</Text>
              <TextInput
                style={styles.input}
                value={reminderForm.title}
                onChangeText={(text) => setReminderForm((current) => ({ ...current, title: text }))}
                textAlign="right"
              />
              <Text style={styles.inputLabel}>הודעה</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={reminderForm.message}
                onChangeText={(text) =>
                  setReminderForm((current) => ({ ...current, message: text }))
                }
                multiline
                textAlign="right"
              />
              <HebrewDatePicker
                value={{
                  hebrewMonth: reminderForm.hebrewMonth,
                  hebrewDay: reminderForm.hebrewDay,
                }}
                onChange={(next) =>
                  setReminderForm((current) => ({
                    ...current,
                    hebrewMonth: next.hebrewMonth,
                    hebrewDay: next.hebrewDay,
                  }))
                }
              />
              <Text style={styles.inputLabel}>שעה (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={reminderForm.time}
                onChangeText={(text) => setReminderForm((current) => ({ ...current, time: text }))}
                placeholder="09:00"
                textAlign="right"
              />
              <Text style={styles.inputLabel}>מתי להזכיר?</Text>
              <OffsetPicker
                allowDefault
                styles={styles}
                value={reminderForm.reminderOffsetMinutes}
                customValue={customReminderOffset}
                customLabel="כמה דקות לפני התזכורת?"
                onChange={(minutes, customText) => {
                  setCustomReminderOffset(customText);
                  setReminderForm((current) => ({
                    ...current,
                    reminderOffsetMinutes: minutes,
                  }));
                }}
              />
              <Pressable style={styles.saveButton} onPress={handleSaveCustomReminder}>
                <Text style={styles.saveButtonText}>{ButtonCopy.save}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.appearanceTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.appearanceHelper}</Text>
        <View style={styles.card}>
          {APPEARANCE_PREFERENCE_OPTIONS.map((option, index) => {
            const selected = appearancePreference === option.key;

            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.optionRow,
                  index < APPEARANCE_PREFERENCE_OPTIONS.length - 1 && styles.optionRowBorder,
                ]}
                onPress={() => void handleAppearancePreference(option.key)}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {selected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.accessibilityTitle}</Text>
        <View style={styles.card}>
          <Text style={styles.accessibilityText}>{SettingsCopy.accessibilityText}</Text>
          <Text style={styles.accessibilityEmailLabel}>{SettingsCopy.accessibilityEmailLabel}</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={AccessibilityCopy.emailAccessibilityLabel}
            onPress={() => {
              void openEmailAddress(APP_META.email, {
                subject: AccessibilityCopy.emailSubject,
              }).then((opened) => {
                if (!opened) {
                  Alert.alert(
                    AccessibilityCopy.emailUnavailableTitle,
                    AccessibilityCopy.emailUnavailableMessage,
                  );
                }
              });
            }}>
            <Text style={styles.accessibilityEmailLink}>{APP_META.email}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.privacyTitle}</Text>
        <View style={[styles.card, styles.privacyCard]}>
          <Text style={styles.privacyTagline}>{SettingsCopy.privacyTagline}</Text>
          <Text style={styles.privacySummary}>{SettingsCopy.privacySummary}</Text>
          {SettingsCopy.privacyBullets.map((bullet) => (
            <Text key={bullet} style={styles.privacyBullet}>
              {`• ${bullet}`}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{SettingsCopy.aboutLinkTitle}</Text>
        <Text style={styles.sectionHelper}>{SettingsCopy.aboutLinkHelper}</Text>
        <Pressable style={styles.card} onPress={() => router.push('/about')}>
          <View style={styles.aboutLinkRow}>
            <Image
              source={require('@/assets/images/rebiid-logo.webp')}
              style={styles.aboutLinkLogo}
              contentFit="contain"
              accessibilityLabel={REBIID.name}
            />
            <View style={styles.aboutLinkText}>
              <Text style={styles.aboutLinkLabel}>{REBIID.name}</Text>
              <Text style={styles.aboutLinkSubtitle}>{REBIID.tagline}</Text>
            </View>
            <Text style={styles.aboutLinkChevron}>‹</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
