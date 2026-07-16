import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RtlTextTokens } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useScreenLayout } from '@/hooks/useScreenLayout';

interface AppShellProps {
  children: ReactNode;
  /** Optional home header — rendered inside the same ScrollView as children. */
  hero?: ReactNode;
  footerInset?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Single vertical scroll for home: hero + cards together.
 * Only the tab bar (outside this shell) stays fixed — not the header.
 */
export function AppShell({ children, hero, footerInset = 0, contentStyle }: AppShellProps) {
  const theme = useAppTheme();
  const { horizontalPadding } = useScreenLayout();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: footerInset + theme.layout.scrollPaddingBottom,
              maxWidth: theme.layout.contentMaxWidth,
            },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {hero}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
});

export { RtlTextTokens };
