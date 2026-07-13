import { Tabs } from 'expo-router';

import { BottomNavigation } from '@/src/components/navigation/BottomNavigation';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'היום',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'לוח',
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'תזכורות',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'הגדרות',
        }}
      />
    </Tabs>
  );
}
