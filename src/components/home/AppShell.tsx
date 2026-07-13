import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RtlTextTokens } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useScreenLayout } from '@/hooks/useScreenLayout';

interface AppShellProps {
  children: ReactNode;
  hero?: ReactNode;
  footerInset?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppShell({ children, hero, footerInset = 0, contentStyle }: AppShellProps) {
  const theme = useAppTheme();
  const { horizontalPadding } = useScreenLayout();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {hero}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: footerInset + theme.layout.scrollPaddingBottom,
              maxWidth: theme.layout.contentMaxWidth,
            },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    width: '100%',
    alignSelf: 'center',
  },
});

export { RtlTextTokens };
