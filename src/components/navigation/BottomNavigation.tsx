import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { physicalLtrRow, TAB_ROUTE_PHYSICAL_LTR_ORDER } from '@/constants/layout';
import { useTheme } from '@/src/theme/useTheme';
import { RtlCenteredText } from '@/src/components/rtl';

type TabIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_ICONS: Record<string, TabIconName> = {
  index: 'home-outline',
  calendar: 'calendar-month-outline',
  reminders: 'bell-outline',
  settings: 'cog-outline',
};

/**
 * Tab bar: physicalLtrRow + TAB_ROUTE_PHYSICAL_LTR_ORDER (no reverse + row-reverse).
 * Physical left → right: הגדרות | תזכורות | לוח | היום
 * Physical far right = היום; far left = הגדרות.
 */
export function BottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const androidNavInset = Platform.OS === 'android' ? insets.bottom : 0;
  const height = theme.layout.tabBarHeight + androidNavInset;

  const routesByName = Object.fromEntries(state.routes.map((route) => [route.name, route]));

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
      {TAB_ROUTE_PHYSICAL_LTR_ORDER.map((routeName) => {
        const route = routesByName[routeName];
        if (!route) {
          return null;
        }

        const index = state.routes.findIndex((r) => r.key === route.key);
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = state.index === index;
        const iconName = TAB_ICONS[route.name] ?? 'circle-outline';
        const color = focused ? theme.colors.tabIconSelected : theme.colors.tabIconDefault;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
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
            <RtlCenteredText style={[styles.label, { color }]}>{label}</RtlCenteredText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    ...physicalLtrRow,
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
  },
});
