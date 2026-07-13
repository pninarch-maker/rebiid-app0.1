import { useCallback, useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import {
  NOTIFICATION_CATEGORY_DEFINITIONS,
  NOTIFICATION_CATEGORY_ORDER,
  type NotificationCategoryDefinition,
  type NotificationCategoryId,
} from '@/lib/notificationCategories';
import type { AppSettings, NotificationCategoryPreference } from '@/lib/settingsTypes';
import { NotificationCategorySheet } from '@/src/components/NotificationCategorySheet';
import { createNotificationCategoriesSectionStyles } from '@/src/theme/notificationSheetStyles';
import { useTheme, useThemeStyles } from '@/src/theme/useTheme';

interface NotificationCategoriesSectionProps {
  settings: AppSettings;
  onUpdatePreferences: (
    preferences: AppSettings['notificationCategoryPreferences'],
    options?: { reschedule?: boolean },
  ) => Promise<void>;
}

export function NotificationCategoriesSection({
  settings,
  onUpdatePreferences,
}: NotificationCategoriesSectionProps) {
  const theme = useTheme();
  const styles = useThemeStyles(createNotificationCategoriesSectionStyles);
  const [activeCategoryId, setActiveCategoryId] = useState<NotificationCategoryId | null>(null);

  const activeDefinition = useMemo(
    () => NOTIFICATION_CATEGORY_DEFINITIONS.find((item) => item.id === activeCategoryId) ?? null,
    [activeCategoryId],
  );

  const activePreference = activeCategoryId
    ? settings.notificationCategoryPreferences[activeCategoryId]
    : null;

  const orderedDefinitions = useMemo(
    () =>
      NOTIFICATION_CATEGORY_ORDER.map((id) =>
        NOTIFICATION_CATEGORY_DEFINITIONS.find((item) => item.id === id),
      ).filter((item): item is NotificationCategoryDefinition => Boolean(item)),
    [],
  );

  const updateCategoryPreference = useCallback(
    async (categoryId: NotificationCategoryId, patch: Partial<NotificationCategoryPreference>) => {
      const nextPreferences = {
        ...settings.notificationCategoryPreferences,
        [categoryId]: {
          ...settings.notificationCategoryPreferences[categoryId],
          ...patch,
        },
      };

      if (patch.deliveryMode === 'disabled') {
        nextPreferences[categoryId].enabled = false;
      } else if (patch.deliveryMode) {
        nextPreferences[categoryId].enabled = true;
      }

      await onUpdatePreferences(nextPreferences, { reschedule: true });
    },
    [onUpdatePreferences, settings.notificationCategoryPreferences],
  );

  const handleSheetChange = useCallback(
    (preference: NotificationCategoryPreference) => {
      if (!activeCategoryId) {
        return;
      }

      void updateCategoryPreference(activeCategoryId, preference);
    },
    [activeCategoryId, updateCategoryPreference],
  );

  return (
    <>
      <View style={styles.card}>
        {orderedDefinitions.map((definition, index) => {
          const preference = settings.notificationCategoryPreferences[definition.id];
          const enabled = preference.enabled && preference.deliveryMode !== 'disabled';

          return (
            <View
              key={definition.id}
              style={[styles.categoryRow, index < orderedDefinitions.length - 1 && styles.rowBorder]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveCategoryId(definition.id)}
                style={({ pressed }) => [styles.rowTextPressable, pressed && styles.rowPressed]}>
                <Text style={styles.rowTitle}>{definition.title}</Text>
                <Text style={styles.rowDescription}>{definition.description}</Text>
              </Pressable>
              <Switch
                value={enabled}
                onValueChange={(value) =>
                  void updateCategoryPreference(definition.id, {
                    enabled: value,
                    deliveryMode: value
                      ? preference.deliveryMode === 'disabled'
                        ? 'full'
                        : preference.deliveryMode
                      : 'disabled',
                  })
                }
                trackColor={theme.surfaces.switchTrack}
                thumbColor={theme.surfaces.switchThumb(enabled)}
              />
            </View>
          );
        })}
      </View>

      <NotificationCategorySheet
        visible={activeCategoryId !== null}
        definition={activeDefinition}
        preference={activePreference}
        onChange={handleSheetChange}
        onClose={() => setActiveCategoryId(null)}
      />
    </>
  );
}
