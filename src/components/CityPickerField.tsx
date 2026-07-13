import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CityPickerSheet } from '@/src/components/CityPickerSheet';
import { createCityPickerFieldStyles } from '@/src/theme/cityPickerStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

interface CityPickerFieldProps {
  selectedCity: string;
  onSelect: (cityName: string) => void;
}

export function CityPickerField({ selectedCity, onSelect }: CityPickerFieldProps) {
  const styles = useThemeStyles(createCityPickerFieldStyles);
  const [visible, setVisible] = useState(false);

  const handleSelect = (cityName: string) => {
    setVisible(false);
    onSelect(cityName);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
        onPress={() => setVisible(true)}>
        <View style={styles.row}>
          <Text style={styles.value}>{selectedCity}</Text>
          <Text style={styles.chevron}>˅</Text>
        </View>
      </Pressable>

      <CityPickerSheet
        visible={visible}
        selectedCity={selectedCity}
        onSelect={handleSelect}
        onClose={() => setVisible(false)}
      />
    </>
  );
}
