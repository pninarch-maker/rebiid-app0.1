import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { physicalLtrRow } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useZmanimSettingsKey } from '@/hooks/useZmanimSettingsKey';
import {
  buildReminderDetailsFromUpcoming,
  type ReminderDetailsData,
} from '@/lib/reminderDetails';
import { getTimeOfDayGreeting, HomeCopy } from '@/lib/rebiidCopy';
import { getTodayKnowledgeSections, type KnowledgeRecord } from '@/lib/knowledgeService';
import { isShabbatMinhagRecord } from '@/src/data/knowledge/shabbatMatch';
import { dedupeMinhagRecords } from '@/src/data/knowledge/minhagExactMatch';
import { currentAppSettings } from '@/lib/appState';
import { getAppSettings } from '@/lib/settings';
import { resolveNotificationCategoryIdForReminder } from '@/lib/notificationCategories';
import { shouldShowCategoryOnHome } from '@/lib/notificationCategoryPrefs';
import type { AddressGender, AppSettings } from '@/lib/settingsTypes';
import {
  getCityFromZmanimSettingsKey,
  getHomeKeyZmanimDisplayRows,
  getZmanimDisplayTitle,
} from '@/lib/zmanimDisplay';
import {
  AppShell,
  BentoCard,
  FloatingHistoryButton,
  HebrewDateHero,
  KnowledgeItemBody,
  KnowledgeItemTitle,
  KnowledgePreviewList,
  ReminderCard,
  TodayStatus,
  ZmanimCard,
} from '@/src/components/home';
import { JewishHistoryModal } from '@/src/components/JewishHistoryModal';
import { ReminderDetailsModal } from '@/src/components/ReminderDetailsModal';
import { JewishEngine } from '@/src/engine/JewishEngine';
import type { UpcomingReminder } from '@/src/engine/types';

const HISTORY_FAB_MARGIN = 12;

function dedupeKnowledgeRecords(records: KnowledgeRecord[]): KnowledgeRecord[] {
  const seen = new Set<string>();
  const result: KnowledgeRecord[] = [];

  for (const record of records) {
    const key = JSON.stringify(record);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(record);
  }

  return result;
}

function mergeMinhagimForFriday(
  allMinhagim: KnowledgeRecord[],
  isFriday: boolean,
): KnowledgeRecord[] {
  if (!isFriday) {
    return allMinhagim;
  }

  const daily = allMinhagim.filter((record) => !isShabbatMinhagRecord(record));
  const shabbat = allMinhagim.filter((record) => isShabbatMinhagRecord(record));
  return dedupeMinhagRecords([...daily, ...shabbat]);
}

export default function TodayScreen() {
  const theme = useAppTheme();
  const { horizontalPadding, isTwoColumnLayout } = useScreenLayout();
  const insets = useSafeAreaInsets();
  const zmanimSettingsKey = useZmanimSettingsKey();
  const today = useMemo(() => JewishEngine.getToday(), [zmanimSettingsKey]);
  const upcoming = useMemo(() => JewishEngine.getUpcomingReminders(30), [zmanimSettingsKey]);
  const [homeSettings, setHomeSettings] = useState<AppSettings>(currentAppSettings);
  const mainReminder = useMemo(() => {
    for (const reminder of upcoming) {
      const categoryId = resolveNotificationCategoryIdForReminder(reminder);
      if (shouldShowCategoryOnHome(categoryId, homeSettings)) {
        return reminder;
      }
    }
    return undefined;
  }, [homeSettings, upcoming]);
  // Yahrzeits are informational knowledge — always shown, never gated by notification prefs.
  const showMinhagimOnHome = shouldShowCategoryOnHome('minhag_segulah', homeSettings);
  const showHistoryOnHome = shouldShowCategoryOnHome('historical_events', homeSettings);
  const [addressGender, setAddressGender] = useState<AddressGender>(
    currentAppSettings.addressGender,
  );

  useFocusEffect(
    useCallback(() => {
      void getAppSettings().then((settings) => {
        setAddressGender(settings.addressGender);
        setHomeSettings(settings);
      });
    }, []),
  );

  const greeting = useMemo(
    () => getTimeOfDayGreeting(new Date(), addressGender),
    [addressGender],
  );

  const zmanimRows = useMemo(() => getHomeKeyZmanimDisplayRows(today.zmanim), [today.zmanim]);
  const zmanimTitle = useMemo(
    () => getZmanimDisplayTitle(getCityFromZmanimSettingsKey(zmanimSettingsKey)),
    [zmanimSettingsKey],
  );
  const knowledge = useMemo(() => getTodayKnowledgeSections(), [zmanimSettingsKey]);
  const isFriday = useMemo(() => new Date().getDay() === 5, [zmanimSettingsKey]);

  const yahrzeits = useMemo(
    () => dedupeKnowledgeRecords(knowledge.yahrzeits),
    [knowledge.yahrzeits],
  );

  const minhagim = useMemo(
    () => mergeMinhagimForFriday(knowledge.minhagimSegulot, isFriday),
    [isFriday, knowledge.minhagimSegulot],
  );

  const historyFabBottom = HISTORY_FAB_MARGIN + insets.bottom;
  const bentoItemStyle = isTwoColumnLayout ? styles.bentoHalf : styles.bentoFull;
  const bentoOrder = isTwoColumnLayout
    ? { reminder: 2, zmanim: 1, yahrzeits: 4, minhagim: 3 }
    : { reminder: 1, zmanim: 2, yahrzeits: 3, minhagim: 4 };

  const [detailsReminder, setDetailsReminder] = useState<ReminderDetailsData | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [expandedYahrzeits, setExpandedYahrzeits] = useState(false);
  const [expandedMinhagim, setExpandedMinhagim] = useState(false);

  const openReminderDetails = useCallback((reminder: UpcomingReminder) => {
    setDetailsReminder(buildReminderDetailsFromUpcoming(reminder));
    setDetailsVisible(true);
  }, []);

  const closeReminderDetails = useCallback(() => {
    setDetailsVisible(false);
    setDetailsReminder(null);
  }, []);

  const footerInset =
    historyFabBottom + (showHistoryOnHome ? theme.layout.floatingButtonSize + 16 : 0);

  return (
    <View style={styles.screenRoot}>
      <AppShell
        footerInset={footerInset}
        hero={
          <HebrewDateHero
            greeting={greeting}
            subtitle={HomeCopy.subtitle}
            hebrewDate={today.hebrewDate}
            gregorianDate={today.gregorianDate}
          />
        }>
        <TodayStatus hasMainReminder={Boolean(mainReminder)} />

        <View style={[styles.bentoGrid, { gap: theme.layout.bentoGridGap }]}>
          <BentoCard
            title={HomeCopy.mainReminderTitle}
            icon="bell-outline"
            style={[bentoItemStyle, { order: bentoOrder.reminder } as ViewStyle]}>
            <ReminderCard reminder={mainReminder} onPress={openReminderDetails} />
          </BentoCard>

          <BentoCard
            title={zmanimTitle}
            icon="weather-sunset"
            style={[bentoItemStyle, { order: bentoOrder.zmanim } as ViewStyle]}>
            <ZmanimCard rows={zmanimRows} />
          </BentoCard>

          <BentoCard
            title={HomeCopy.yahrzeitsCardTitle}
            icon="candle"
            style={[bentoItemStyle, { order: bentoOrder.yahrzeits } as ViewStyle]}>
            <KnowledgePreviewList
              emptyText={HomeCopy.emptyYahrzeits}
              expanded={expandedYahrzeits}
              items={yahrzeits}
              onToggleExpand={() => setExpandedYahrzeits((value) => !value)}
              renderItem={(item) => (
                <>
                  <KnowledgeItemTitle>{item['שם'] ?? ''}</KnowledgeItemTitle>
                  {item['פרט קצר'] ? (
                    <KnowledgeItemBody>{item['פרט קצר']}</KnowledgeItemBody>
                  ) : null}
                </>
              )}
              itemKey={(item, index) =>
                item.id ?? `${item['שם']}-${item['חודש']}-${item['יום']}-${index}`
              }
            />
          </BentoCard>

          <BentoCard
            title={HomeCopy.minhagimCardTitle}
            icon="star-outline"
            style={[bentoItemStyle, { order: bentoOrder.minhagim } as ViewStyle]}>
            {showMinhagimOnHome ? (
              <KnowledgePreviewList
                emptyText={HomeCopy.emptyMinhagim}
                expanded={expandedMinhagim}
                items={minhagim}
                onToggleExpand={() => setExpandedMinhagim((value) => !value)}
                renderItem={(item) => (
                  <>
                    <KnowledgeItemTitle>{item['שם קצר'] ?? ''}</KnowledgeItemTitle>
                    {item['פרט קצר'] ? (
                      <KnowledgeItemBody>{item['פרט קצר']}</KnowledgeItemBody>
                    ) : null}
                  </>
                )}
                itemKey={(item, index) =>
                  `${item['שם קצר']}-${item['תאריך / כלל']}-${index}`
                }
              />
            ) : (
              <KnowledgePreviewList
                emptyText={HomeCopy.emptyMinhagim}
                expanded={false}
                items={[]}
                onToggleExpand={() => undefined}
                renderItem={() => null}
                itemKey={(_, index) => String(index)}
              />
            )}
          </BentoCard>
        </View>
      </AppShell>

      {showHistoryOnHome ? (
        <FloatingHistoryButton
          accessibilityLabel={HomeCopy.historyFabAccessibilityLabel}
          bottom={historyFabBottom}
          left={horizontalPadding}
          onPress={() => setHistoryVisible(true)}
        />
      ) : null}

      <JewishHistoryModal
        visible={historyVisible}
        records={knowledge.jewishHistory}
        onClose={() => setHistoryVisible(false)}
      />

      <ReminderDetailsModal
        visible={detailsVisible}
        reminder={detailsReminder}
        onClose={closeReminderDetails}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    position: 'relative',
  },
  bentoGrid: {
    ...physicalLtrRow,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bentoHalf: {
    width: '48%',
    minWidth: 0,
  },
  bentoFull: {
    width: '100%',
  },
});
