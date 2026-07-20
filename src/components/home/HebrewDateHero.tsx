import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { RtlBlock, RtlText } from '@/src/components/rtl';

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
  const { horizontalPadding } = useScreenLayout();

  return (
    <RtlBlock
      style={[
        styles.hero,
        {
          backgroundColor: theme.heroBackground,
          paddingHorizontal: horizontalPadding,
        },
      ]}>
      <RtlText variant="heading" style={[styles.greeting, { color: theme.colors.textSecondary }]}>
        {greeting}
      </RtlText>
      <RtlText variant="heading" style={[styles.subtitle, { color: theme.colors.text }]}>
        {subtitle}
      </RtlText>
      <RtlText variant="heading" style={[styles.hebrewDate, { color: theme.colors.text }]}>
        {hebrewDate}
      </RtlText>
      <RtlText variant="heading" style={[styles.gregorianDate, { color: theme.colors.textSecondary }]}>
        {gregorianDate}
      </RtlText>
    </RtlBlock>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  hebrewDate: {
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 52,
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: 18,
    fontWeight: '500',
  },
});
