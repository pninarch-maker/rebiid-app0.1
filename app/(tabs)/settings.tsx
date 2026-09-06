import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LtrValueText, RtlText } from '@/src/components/rtl';

import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useAppearancePreference } from '@/hooks/useAppearancePreference';
import { APP_META, getAppVersion } from '@/lib/appInfo';
import { getCityByKey } from '@/lib/cities';
import { openEmailAddress } from '@/lib/contactLinks';
import { rescheduleNotificationsAfterSettingsChange, enableNotifications, disableNotifications, scheduleTestNotification } from '@/lib/notifications';
import { NOTIFICATION_MODE_OPTIONS, type NotificationMode } from '@/lib/notificationMode';
import { openAndroidNotificationChannelSettings } from '@/lib/openNotificationChannelSettings';
import {
  AboutScreenCopy,
  ButtonCopy,
  EmptyCopy,
  ErrorCopy,
  SettingsCopy,
  SuccessCopy,
  REBIID,
  AccessibilityCopy,
} from '@/lib/rebiidCopy';
import { RtlLabelValueRow } from '@/src/components/RtlLabelValueRow';
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
  createEmptyPersonalReminderForm,
  draftInputFromForm,
  PersonalReminderForm,
  personalFormFromReminder,
  type PersonalReminderFormValue,
} from '@/src/components/PersonalReminderForm';
import {
  createSettingsStyles,
  type SettingsScreenStyles,
} from '@/src/theme/settingsScreenStyles';
import { useTheme, useThemeStyles } from '@/src/theme/useTheme';
import { formatHebrewCustomDateWithTime } from '@/lib/hebrewMonths';
import { buildCustomReminderFromDraft } from '@/lib/personalReminderScheduling';
import { PERSONAL_REMINDER_KIND_OPTIONS } from '@/lib/personalReminderTypes';

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
            {selected ? <Text style={styles.checkmark}>✓</Text> : <View style={styles.checkmarkSpacer} />}
            <RtlText inRow style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
              {option.label}
            </RtlText>
          </Pressable>
        );
      })}
      {preset === 'custom' ? (
        <View style={styles.customInputBlock}>
          <RtlText style={styles.inputLabel}>{customLabel}</RtlText>
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

const EMPTY_MINHAG_FORM: Omit<CustomReminder, 'id'> = {
  title: '',
  message: '',
  hebrewMonth: 'Nisan',
  hebrewDay: 1,
  time: '09:00',
  enabled: true,
  reminderOffsetMinutes: USE_DEFAULT_REMINDER_OFFSET,
  category: 'minhag_segulah',
};

function emptyFormForCategory(category: CustomReminderCategory): Omit<CustomReminder, 'id'> {
  return { ...EMPTY_MINHAG_FORM, category };
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
  const [personalForm, setPersonalForm] = useState<PersonalReminderFormValue>(() =>
    createEmptyPersonalReminderForm(),
  );
  const [editingPersonalId, setEditingPersonalId] = useState<string | null>(null);
  const [showMinhagForm, setShowMinhagForm] = useState(false);
  const [minhagForm, setMinhagForm] = useState(() => emptyFormForCategory('minhag_segulah'));
  const [minhagCustomOffset, setMinhagCustomOffset] = useState('30');
  const [testingNotification, setTestingNotification] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);

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
      options?: { reschedule?: boolean },
    ) => {
      if (!settings) {
        return;
      }

      const nextSettings: AppSettings = {
        ...settings,
        notificationCategoryPreferences: preferences,
      };

      await persistSettings(nextSettings);
      await loadReminderEngineSettings();
    },
    [persistSettings, settings],
  );

  const handleNotificationModeChange = useCallback(
    async (mode: NotificationMode) => {
      if (!settings || settings.notificationMode === mode) {
        return;
      }

      const nextSettings: AppSettings = {
        ...settings,
        notificationMode: mode,
      };

      await persistSettings(nextSettings);

      if (Platform.OS === 'android') {
        await openAndroidNotificationChannelSettings(mode);
      }
    },
    [persistSettings, settings],
  );

  const handleTestNotification = useCallback(async () => {
    setTestingNotification(true);
    try {
      const result = await scheduleTestNotification();
      if (result.success) {
        if (result.diagnosticsText) {
          Alert.alert('REBIID — אבחון ערוצים', result.diagnosticsText);
        } else {
          Alert.alert('REBIID', SuccessCopy.testNotification);
        }
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
    if (!settings || savingPersonal) {
      return;
    }

    const id = editingPersonalId ?? createCustomReminderId();
    const existing = editingPersonalId
      ? settings.customReminders.find((item) => item.id === editingPersonalId) ?? null
      : null;

    const { reminder, errors } = buildCustomReminderFromDraft({
      id,
      title: personalForm.title,
      message: personalForm.message,
      enabled: existing?.enabled ?? true,
      reminderOffsetMinutes: personalForm.reminderOffsetMinutes,
      category: 'personal',
      draft: draftInputFromForm(personalForm),
      existing,
    });

    if (errors.length > 0) {
      Alert.alert('רגע', errors[0]?.messageHe ?? ErrorCopy.generic);
      return;
    }

    const nextReminders = editingPersonalId
      ? settings.customReminders.map((item) => (item.id === editingPersonalId ? reminder : item))
      : [...settings.customReminders, reminder];

    setSavingPersonal(true);
    setSyncing(true);
    try {
      await saveCustomReminders(nextReminders);
      const refreshed = await getAppSettings();
      setSettings(refreshed);
      await loadReminderEngineSettings();
      await rescheduleNotificationsAfterSettingsChange();
      setPersonalForm(createEmptyPersonalReminderForm());
      setEditingPersonalId(null);
      setShowReminderForm(false);
    } catch {
      Alert.alert('רגע', ErrorCopy.storage);
    } finally {
      setSavingPersonal(false);
      setSyncing(false);
    }
  }, [editingPersonalId, personalForm, savingPersonal, settings]);

  const handleEditPersonalReminder = useCallback((reminder: CustomReminder) => {
    setPersonalForm(personalFormFromReminder(reminder));
    setEditingPersonalId(reminder.id);
    setShowReminderForm(true);
  }, []);

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

      Alert.alert('מחיקת תזכורת', 'למחוק את התזכורת האישית? פעולה זו אינה ניתנת לביטול.', [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            const nextReminders = settings.customReminders.filter((item) => item.id !== id);
            setSyncing(true);
            try {
              await saveCustomReminders(nextReminders);
              const refreshed = await getAppSettings();
              setSettings(refreshed);
              await loadReminderEngineSettings();
              await rescheduleNotificationsAfterSettingsChange();
              if (editingPersonalId === id) {
                setEditingPersonalId(null);
                setPersonalForm(createEmptyPersonalReminderForm());
                setShowReminderForm(false);
              }
            } catch {
              Alert.alert('רגע', ErrorCopy.storage);
            } finally {
              setSyncing(false);
            }
          },
        },
      ]);
    },
    [editingPersonalId, settings],
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
          <RtlText variant="heading" style={styles.title}>{SettingsCopy.title}</RtlText>
          {syncing ? <ActivityIndicator color={theme.colors.primary} /> : null}
        </View>

        <RtlText style={styles.intro}>{SettingsCopy.intro}</RtlText>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.addressTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.addressHelper}</RtlText>
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
                {selected ? <Text style={styles.checkmark}>✓</Text> : <View style={styles.checkmarkSpacer} />}
                <RtlText inRow style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </RtlText>
              </Pressable>
            );
          })}
        </View>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.cityTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.cityHelper}</RtlText>
        <CityPickerField
          selectedCity={settings.city}
          onSelect={(cityName) => void handleSelectCity(cityName)}
        />

        <RtlText style={styles.sectionTitle}>{SettingsCopy.candleTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.candleHelper}</RtlText>
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
                {selected ? <Text style={styles.checkmark}>✓</Text> : <View style={styles.checkmarkSpacer} />}
                <RtlText inRow style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {label}
                </RtlText>
              </Pressable>
            );
          })}
          {candlePreset === 'custom' ? (
            <View style={styles.customInputBlock}>
              <RtlText style={styles.inputLabel}>כמה דקות לפני שקיעה?</RtlText>
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

        <RtlText style={styles.sectionTitle}>{SettingsCopy.havdalahTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.havdalahHelper}</RtlText>
        <View style={styles.card}>
          <Pressable
            style={[styles.optionRow, styles.optionRowBorder]}
            onPress={() => handleHavdalah('regular')}>
            {settings.havdalahMethod === 'regular' ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <View style={styles.checkmarkSpacer} />
            )}
            <RtlText
              style={[
                styles.optionLabel,
                settings.havdalahMethod === 'regular' && styles.optionLabelSelected,
              ]}>
              {SettingsCopy.havdalahRegular}
            </RtlText>
          </Pressable>
          <Pressable style={styles.optionRow} onPress={() => handleHavdalah('rabbeinu_tam')}>
            {settings.havdalahMethod === 'rabbeinu_tam' ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <View style={styles.checkmarkSpacer} />
            )}
            <RtlText
              style={[
                styles.optionLabel,
                settings.havdalahMethod === 'rabbeinu_tam' && styles.optionLabelSelected,
              ]}>
              {SettingsCopy.havdalahRabbeinuTam}
            </RtlText>
          </Pressable>
        </View>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.notificationsTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.notificationsHelper}</RtlText>
        <RtlText style={styles.privacyNote}>{SettingsCopy.notificationsPrivacyNote}</RtlText>
        <View style={styles.card}>
          <View style={styles.masterToggleRow}>
            <View style={styles.masterToggleSwitchWrap}>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={theme.surfaces.switchTrack}
                thumbColor={theme.surfaces.switchThumb(settings.notificationsEnabled)}
              />
            </View>
            <View style={styles.masterToggleLabelWrap}>
              <Text style={styles.masterToggleLabel}>{SettingsCopy.notificationsToggle}</Text>
            </View>
          </View>
        </View>

        <RtlText style={styles.sectionHelper}>{SettingsCopy.notificationModeHelper}</RtlText>
        <View style={styles.card}>
          {NOTIFICATION_MODE_OPTIONS.map((option, index) => (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: settings.notificationMode === option.key }}
              style={[
                styles.optionRow,
                index < NOTIFICATION_MODE_OPTIONS.length - 1 && styles.optionRowBorder,
              ]}
              onPress={() => void handleNotificationModeChange(option.key)}>
              {settings.notificationMode === option.key ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <View style={styles.checkmarkSpacer} />
              )}
              <RtlText
                style={[
                  styles.optionLabel,
                  settings.notificationMode === option.key && styles.optionLabelSelected,
                ]}>
                {option.label}
              </RtlText>
            </Pressable>
          ))}
          <Pressable
            style={styles.testButton}
            onPress={handleTestNotification}
            disabled={testingNotification || syncing}>
            {testingNotification ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <RtlText style={styles.testButtonText}>{ButtonCopy.testNotification}</RtlText>
            )}
          </Pressable>
        </View>

        <RtlText style={styles.sectionHelper}>{SettingsCopy.notificationsCategoriesHelper}</RtlText>
        <NotificationCategoriesSection
          settings={settings}
          onUpdatePreferences={handleUpdateNotificationPreferences}
        />

        <RtlText style={styles.sectionTitle}>{SettingsCopy.minhagSegulahTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.minhagSegulahHelper}</RtlText>
        {minhagCategoryEnabled ? (
          <View style={styles.card}>
            <RtlText style={styles.inputLabel}>{SettingsCopy.minhagSegulahTemplatesTitle}</RtlText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
              {MINHAG_SEGULAH_TEMPLATES.map((template) => (
                <Pressable
                  key={template.id}
                  style={styles.monthChip}
                  onPress={() => handleApplyMinhagTemplate(template.title, template.message)}>
                  <RtlText style={styles.monthChipText}>{template.title}</RtlText>
                </Pressable>
              ))}
            </ScrollView>

            <RtlText style={[styles.inputLabel, styles.minhagCustomTitle]}>
              {SettingsCopy.minhagSegulahCustomTitle}
            </RtlText>
            {minhagReminders.length === 0 ? (
              <RtlText style={styles.emptyText}>{EmptyCopy.personalReminders}</RtlText>
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
                      <RtlText style={styles.rowTitle}>{reminder.title}</RtlText>
                      <RtlText style={styles.rowDescription}>
                        {formatHebrewCustomDateWithTime(
                          reminder.hebrewDay,
                          reminder.hebrewMonth,
                          reminder.time,
                        )}
                      </RtlText>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(value) => handleToggleCustomReminder(reminder.id, value)}
                      trackColor={theme.surfaces.switchTrack}
                      thumbColor={theme.surfaces.switchThumb(reminder.enabled)}
                    />
                  </View>
                  <RtlText style={styles.rowDescription}>{reminder.message}</RtlText>
                  <Pressable onPress={() => handleDeleteCustomReminder(reminder.id)}>
                    <RtlText style={styles.deleteText}>מחק תזכורת</RtlText>
                  </Pressable>
                </View>
              ))
            )}

            <Pressable
              style={styles.addButton}
              onPress={() => setShowMinhagForm((current) => !current)}>
              <RtlText style={styles.addButtonText}>
                {showMinhagForm ? ButtonCopy.closeForm : SettingsCopy.addMinhagReminder}
              </RtlText>
            </Pressable>

            {showMinhagForm ? (
              <View style={styles.formBlock}>
                <RtlText style={styles.inputLabel}>כותרת</RtlText>
                <TextInput
                  style={styles.input}
                  value={minhagForm.title}
                  onChangeText={(text) => setMinhagForm((current) => ({ ...current, title: text }))}
                  textAlign="right"
                />
                <RtlText style={styles.inputLabel}>הודעה</RtlText>
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
                <RtlText style={styles.inputLabel}>שעה (HH:MM)</RtlText>
                <TextInput
                  style={styles.input}
                  value={minhagForm.time}
                  onChangeText={(text) => setMinhagForm((current) => ({ ...current, time: text }))}
                  placeholder="09:00"
                  textAlign="right"
                />
                <RtlText style={styles.inputLabel}>מתי להזכיר?</RtlText>
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
                  <RtlText style={styles.saveButtonText}>{ButtonCopy.save}</RtlText>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <RtlText style={styles.sectionHelper}>
            הפעילו את קטגוריית «מנהגים וסגולות» בחלק ההתראות כדי להוסיף תזכורות מותאמות.
          </RtlText>
        )}

        <RtlText style={styles.sectionTitle}>{SettingsCopy.personalTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.personalHelper}</RtlText>
        <View style={styles.card}>
          {personalReminders.length === 0 ? (
            <RtlText style={styles.emptyText}>{EmptyCopy.personalReminders}</RtlText>
          ) : (
            personalReminders.map((reminder, index) => {
              const kindLabel =
                PERSONAL_REMINDER_KIND_OPTIONS.find((item) => item.key === reminder.kind)?.label ??
                'אישי';
              return (
                <View
                  key={reminder.id}
                  style={[
                    styles.reminderItem,
                    index < personalReminders.length - 1 && styles.optionRowBorder,
                  ]}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <RtlText style={styles.rowTitle}>{reminder.title}</RtlText>
                      <RtlText style={styles.rowDescription}>
                        {kindLabel}
                        {' · '}
                        {formatHebrewCustomDateWithTime(
                          reminder.hebrewDay,
                          reminder.hebrewMonth,
                          reminder.reminderTimeLocal ?? reminder.time,
                        )}
                        {reminder.recurrence === 'once' ? ' · חד־פעמי' : ' · שנתי עברי'}
                      </RtlText>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(value) => handleToggleCustomReminder(reminder.id, value)}
                      trackColor={theme.surfaces.switchTrack}
                      thumbColor={theme.surfaces.switchThumb(reminder.enabled)}
                    />
                  </View>
                  {reminder.message ? (
                    <RtlText style={styles.rowDescription}>{reminder.message}</RtlText>
                  ) : null}
                  <Pressable onPress={() => handleEditPersonalReminder(reminder)}>
                    <RtlText style={styles.rowDescription}>עריכה</RtlText>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteCustomReminder(reminder.id)}>
                    <RtlText style={styles.deleteText}>מחק תזכורת</RtlText>
                  </Pressable>
                </View>
              );
            })
          )}

          <Pressable
            style={styles.addButton}
            onPress={() => {
              if (showReminderForm) {
                setShowReminderForm(false);
                setEditingPersonalId(null);
                setPersonalForm(createEmptyPersonalReminderForm());
              } else {
                setEditingPersonalId(null);
                setPersonalForm(createEmptyPersonalReminderForm());
                setShowReminderForm(true);
              }
            }}>
            <RtlText style={styles.addButtonText}>
              {showReminderForm ? ButtonCopy.closeForm : ButtonCopy.addPersonalReminder}
            </RtlText>
          </Pressable>

          {showReminderForm ? (
            <PersonalReminderForm
              styles={styles}
              value={personalForm}
              onChange={setPersonalForm}
              onSave={() => void handleSaveCustomReminder()}
              saving={savingPersonal}
              editId={editingPersonalId}
              offsetPicker={
                <OffsetPicker
                  allowDefault
                  styles={styles}
                  value={personalForm.reminderOffsetMinutes}
                  customValue={customReminderOffset}
                  customLabel="כמה דקות לפני התזכורת?"
                  onChange={(minutes, customText) => {
                    setCustomReminderOffset(customText);
                    setPersonalForm((current) => ({
                      ...current,
                      reminderOffsetMinutes: minutes,
                    }));
                  }}
                />
              }
            />
          ) : null}
        </View>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.appearanceTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.appearanceHelper}</RtlText>
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
                {selected ? <Text style={styles.checkmark}>✓</Text> : <View style={styles.checkmarkSpacer} />}
                <RtlText inRow style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </RtlText>
              </Pressable>
            );
          })}
        </View>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.accessibilityTitle}</RtlText>
        <View style={styles.card}>
          <RtlText style={styles.accessibilityText}>{SettingsCopy.accessibilityText}</RtlText>
          <RtlText style={styles.accessibilityEmailLabel}>{SettingsCopy.accessibilityEmailLabel}</RtlText>
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
            <LtrValueText style={styles.accessibilityEmailLink}>{APP_META.email}</LtrValueText>
          </Pressable>
        </View>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.privacyTitle}</RtlText>
        <View style={[styles.card, styles.privacyCard]}>
          <RtlText style={styles.privacyTagline}>{SettingsCopy.privacyTagline}</RtlText>
          <RtlText style={styles.privacySummary}>{SettingsCopy.privacySummary}</RtlText>
          {SettingsCopy.privacyBullets.map((bullet) => (
            <RtlText key={bullet} style={styles.privacyBullet}>
              {`• ${bullet}`}
            </RtlText>
          ))}
        </View>

        <RtlText style={styles.sectionTitle}>{SettingsCopy.aboutLinkTitle}</RtlText>
        <RtlText style={styles.sectionHelper}>{SettingsCopy.aboutLinkHelper}</RtlText>
        <View style={styles.aboutCard}>
          <View style={styles.aboutLogoWrap}>
            <Image
              source={require('@/assets/images/rebiid-logo.webp')}
              style={styles.aboutLogo}
              contentFit="contain"
              accessibilityLabel={REBIID.name}
            />
          </View>

          <RtlLabelValueRow
            style={styles.aboutMetaRow}
            bordered
            label={AboutScreenCopy.versionLabel}
            value={getAppVersion()}
            valueDirection="ltr"
          />
          <RtlLabelValueRow
            style={styles.aboutMetaRow}
            bordered
            label={AboutScreenCopy.developerLabel}
            value={APP_META.developer}
          />

          {(
            [
              { key: 'terms', label: AboutScreenCopy.termsTitle },
              { key: 'privacy', label: AboutScreenCopy.privacyTitle },
              { key: 'disclaimer', label: AboutScreenCopy.disclaimerTitle },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              onPress={() => router.push('/about')}
              style={({ pressed }) => [
                styles.aboutNavRow,
                pressed && styles.aboutNavRowPressed,
              ]}>
              {/* Child order in physicalLtrRow: first = physical left (chevron), last = physical right (label). */}
              <Text style={styles.aboutNavChevron}>‹</Text>
              <View style={styles.aboutNavLabelWrap}>
                <RtlText inRow style={styles.aboutNavLabel}>
                  {item.label}
                </RtlText>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
