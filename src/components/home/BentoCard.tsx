import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { createElevation } from '@/constants/tokens';
import { rtlContent } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { RtlCardHeader } from '@/src/components/RtlCardHeader';

interface BentoCardProps {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BentoCard({ title, icon, children, style }: BentoCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
          borderRadius: theme.radius.card,
          padding: theme.layout.cardPadding,
          minHeight: theme.layout.bentoMinHeight,
          ...createElevation(theme.colors.shadow),
        },
        style,
      ]}>
      <RtlCardHeader title={title} icon={icon} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    alignSelf: 'stretch',
    width: '100%',
    alignItems: 'stretch',
  },
  body: {
    ...rtlContent,
  },
});
