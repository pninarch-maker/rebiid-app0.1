import { StyleSheet, Text, View } from 'react-native';

import { rtlHeadingText } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';

interface HebrewDateHeroProps {
  greeting: string;
  subtitle: string;
  hebrewDate: string;
  gregorianDate: string;
}

export function HebrewDateHero({
  greeting,
  subtitle,
  hebrewDate,
  gregorianDate,
}: HebrewDateHeroProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: theme.heroBackground,
        },
      ]}>
      <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>{greeting}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text }]}>{subtitle}</Text>
      <Text style={[styles.hebrewDate, { color: theme.colors.text }]}>{hebrewDate}</Text>
      <Text style={[styles.gregorianDate, { color: theme.colors.textSecondary }]}>
        {gregorianDate}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 8,
    paddingBottom: 24,
    alignSelf: 'stretch',
    width: '100%',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
    ...rtlHeadingText,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    ...rtlHeadingText,
  },
  hebrewDate: {
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 52,
    marginBottom: 4,
    ...rtlHeadingText,
  },
  gregorianDate: {
    fontSize: 18,
    fontWeight: '500',
    ...rtlHeadingText,
  },
});
