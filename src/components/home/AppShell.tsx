import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Layout, physicalStyleDirection } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useScreenLayout } from '@/hooks/useScreenLayout';

interface AppShellProps {
  children: ReactNode;
  /** Optional home header — full viewport width; text padding applied inside the hero. */
  hero?: ReactNode;
  footerInset?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Single vertical scroll for home: hero + cards together.
 * Hero bleeds edge-to-edge; cards use horizontal padding. Only the tab bar stays fixed.
 * Scroll content uses physicalStyleDirection so Hebrew textAlign is not Fabric-mirrored.
 */
export function AppShell({ children, hero, footerInset = 0, contentStyle }: AppShellProps) {
  const theme = useAppTheme();
  const { horizontalPadding, isTwoColumnLayout } = useScreenLayout();
  const contentMaxWidth = isTwoColumnLayout ? undefined : Layout.contentMaxWidth;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: footerInset + theme.layout.scrollPaddingBottom,
            },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {hero ? <View style={styles.heroBleed}>{hero}</View> : null}
          <View
            style={[
              styles.content,
              {
                paddingHorizontal: horizontalPadding,
                maxWidth: contentMaxWidth,
              },
            ]}>
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...physicalStyleDirection,
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
    flexGrow: 1,
    ...physicalStyleDirection,
  },
  heroBleed: {
    alignSelf: 'stretch',
    width: '100%',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
    ...physicalStyleDirection,
  },
});
