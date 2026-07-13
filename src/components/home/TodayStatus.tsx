import { StyleSheet, Text, View } from 'react-native';

import { rtlHeadingText } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomeCopy } from '@/lib/rebiidCopy';

interface TodayStatusProps {
  hasMainReminder: boolean;
}

export function TodayStatus({ hasMainReminder }: TodayStatusProps) {
  const theme = useAppTheme();

  if (hasMainReminder) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
        },
      ]}>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        {HomeCopy.quietMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
    width: '100%',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    ...rtlHeadingText,
  },
});
