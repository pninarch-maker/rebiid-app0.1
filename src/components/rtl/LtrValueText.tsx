import { Text, type TextProps } from 'react-native';

import { mergeLtrValueEndTextStyle, mergeLtrValueTextStyle } from '@/lib/rtlArchitecture';

export type LtrValueAlign = 'start' | 'end';

export interface LtrValueTextProps extends TextProps {
  /**
   * `start` = physical left (default: times in zmanim rows).
   * `end` = physical right (e.g. Gregorian date under a Hebrew hero).
   * Parent must use physicalStyleDirection / RtlBlock for `end`.
   */
  align?: LtrValueAlign;
}

/** Times, Gregorian dates, numbers — LTR writing direction; physical side via `align`. */
export function LtrValueText({ align = 'start', style, ...props }: LtrValueTextProps) {
  const merged =
    align === 'end' ? mergeLtrValueEndTextStyle(style) : mergeLtrValueTextStyle(style);
  return <Text {...props} style={merged} />;
}
