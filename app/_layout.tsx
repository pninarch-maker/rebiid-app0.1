import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { I18nManager, View } from 'react-native';
import 'react-native-reanimated';

import { initializeNotifications } from '@/lib/notifications';
import { AppThemeProvider, useAppTheme } from '@/src/components/theme/AppThemeProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigation() {
  const theme = useAppTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.cardBorder,
        primary: theme.colors.primary,
      },
    }),
    [theme],
  );

  return (
    <>
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1, width: '100%' }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
          </Stack>
        </View>
      </ThemeProvider>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }

    initializeNotifications();
  }, []);

  return (
    <AppThemeProvider>
      <RootNavigation />
    </AppThemeProvider>
  );
}
