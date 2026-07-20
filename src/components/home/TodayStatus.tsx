import { StyleSheet } from 'react-native';

import { rtlContent } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomeCopy } from '@/lib/rebiidCopy';
import { RtlBlock, RtlText } from '@/src/components/rtl';

interface TodayStatusProps {
  hasMainReminder: boolean;
}

export function TodayStatus({ hasMainReminder }: TodayStatusProps) {
  const theme = useAppTheme();

  if (hasMainReminder) {
    return null;
  }

  return (
    <RtlBlock
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
        },
      ]}>
      <RtlText style={[styles.text, { color: theme.colors.textSecondary }]}>
        {HomeCopy.quietMessage}
      </RtlText>
    </RtlBlock>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
