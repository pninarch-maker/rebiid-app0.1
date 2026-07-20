import { Text, type TextProps, type TextStyle } from 'react-native';

import {
  mergeRtlBlockTextStyle,
  mergeRtlHeadingTextStyle,
  RTL_BLOCK_TEXT,
} from '@/lib/rtlArchitecture';

export type RtlTextVariant = 'block' | 'heading';

export interface RtlTextProps extends TextProps {
  variant?: RtlTextVariant;
  /** Use inside physical LTR rows (card headers, settings rows) — flex:1 instead of width:100%. */
  inRow?: boolean;
  style?: TextProps['style'];
}

/**
 * Hebrew text with locked RTL invariants applied at render time.
 * Caller styles (color, fontSize, weight) merge safely; alignment cannot be overridden.
 * Must sit under RtlBlock / rtlContent / physicalLtrRow (physical LTR direction) so
 * textAlign: 'right' means the physical right under native forcesRTL.
 */
export function RtlText({ variant = 'block', inRow = false, style, ...props }: RtlTextProps) {
  let merged: TextStyle =
    variant === 'heading'
      ? mergeRtlHeadingTextStyle(style)
      : mergeRtlBlockTextStyle(style);

  if (inRow) {
    merged = {
      ...merged,
      width: undefined,
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      writingDirection: 'rtl',
    };
  }

  return <Text {...props} style={merged} />;
}

/** Centered Hebrew (tab labels, calendar day numerals in cells). */
export function RtlCenteredText({ style, ...props }: TextProps) {
  return (
    <Text
      {...props}
      style={[
        {
          textAlign: 'center',
          writingDirection: RTL_BLOCK_TEXT.writingDirection,
        },
        style,
      ]}
    />
  );
}
