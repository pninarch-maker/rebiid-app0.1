import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/layout';
import { CITY_OPTIONS } from '@/lib/cities';
import { SettingsCopy } from '@/lib/rebiidCopy';
import { createCityPickerSheetStyles } from '@/src/theme/cityPickerStyles';
import { useTheme, useThemeStyles } from '@/src/theme/useTheme';

interface CityPickerSheetProps {
  visible: boolean;
  selectedCity: string;
  onSelect: (cityName: string) => void;
  onClose: () => void;
}

export function CityPickerSheet({
  visible,
  selectedCity,
  onSelect,
  onClose,
}: CityPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemeStyles(createCityPickerSheetStyles);
  const [query, setQuery] = useState('');

  const filteredCities = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) {
      return CITY_OPTIONS;
    }

    return CITY_OPTIONS.filter((city) => city.name.includes(normalized));
  }, [query]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (cityName: string) => {
    setQuery('');
    onSelect(cityName);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel={SettingsCopy.cityPickerClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{SettingsCopy.cityPickerTitle}</Text>

          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={SettingsCopy.cityPickerSearchPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            textAlign="right"
            accessibilityLabel={SettingsCopy.cityPickerSearchPlaceholder}
          />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {filteredCities.length === 0 ? (
              <Text style={styles.emptyText}>{SettingsCopy.cityPickerEmpty}</Text>
            ) : (
              filteredCities.map((city, index) => {
                const selected = selectedCity === city.name;

                return (
                  <Pressable
                    key={city.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => handleSelect(city.name)}
                    style={[
                      styles.optionRow,
                      index < filteredCities.length - 1 && styles.optionRowBorder,
                    ]}>
                    {selected ? <Text style={styles.checkmark}>✓</Text> : <View style={{ width: 24 }} />}
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {city.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
