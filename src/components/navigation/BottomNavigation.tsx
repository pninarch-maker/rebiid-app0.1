import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { rtlRow } from '@/constants/layout';
import { useTheme } from '@/src/theme/useTheme';

type TabIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_ICONS: Record<string, TabIconName> = {
  index: 'home-outline',
  calendar: 'calendar-month-outline',
  reminders: 'bell-outline',
  settings: 'cog-outline',
};

export function BottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const androidNavInset = Platform.OS === 'android' ? insets.bottom : 0;
  const height = theme.layout.tabBarHeight + androidNavInset;

  return (
    <View
      style={[
        styles.bar,
        {
          height,
          paddingBottom: 16 + androidNavInset,
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.divider,
        },
      ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? 'circle-outline';
        const color = focused ? theme.colors.tabIconSelected : theme.colors.tabIconDefault;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            }}
            style={({ pressed }) => [
              styles.tab,
              pressed && { opacity: theme.motion.pressOpacity },
            ]}>
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: theme.surfaces.tabActiveBg },
              ]}>
              <MaterialCommunityIcons name={iconName} size={24} color={color} />
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    ...rtlRow,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
