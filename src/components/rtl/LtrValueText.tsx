import { Text, type TextProps } from 'react-native';

import { mergeLtrValueTextStyle } from '@/lib/rtlArchitecture';

/** Times, Gregorian dates, numbers — physical left, LTR writing direction. */
export function LtrValueText({ style, ...props }: TextProps) {
  return <Text {...props} style={mergeLtrValueTextStyle(style)} />;
}
