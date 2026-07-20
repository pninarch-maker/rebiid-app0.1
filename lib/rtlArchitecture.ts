import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

/**
 * REBIID RTL architecture — single source of truth for explicit physical layout.
 *
 * Native Android `forcesRTL` mirrors flex rows; never combine native mirroring,
 * `row-reverse`, and reversed child arrays without mapping columns explicitly.
 * Prefer `physicalLtrRow` + documented child order, or `mapEngineWeekToVisualOrder`.
 */

/** Locked invariants for Hebrew block copy — always win over caller styles. */
export const RTL_BLOCK_TEXT: TextStyle = {
  textAlign: 'right',
  writingDirection: 'rtl',
  width: '100%',
  alignSelf: 'stretch',
};

/** Locked invariants for Hebrew headings — same as block; callers add typography only. */
export const RTL_HEADING_TEXT: TextStyle = {
  ...RTL_BLOCK_TEXT,
};

/** LTR technical values (times, Gregorian dates, numbers, email). */
export const LTR_VALUE_TEXT: TextStyle = {
  textAlign: 'left',
  writingDirection: 'ltr',
  flexShrink: 0,
};

/** Stretch wrapper — Hebrew Text must sit inside this when parent may not stretch. */
export const RTL_BLOCK_CONTAINER: ViewStyle = {
  alignSelf: 'stretch',
  width: '100%',
  alignItems: 'stretch',
};

/** Bottom tab route keys in physical right-to-left visual order (היום → הגדרות). */
export const TAB_ROUTE_VISUAL_ORDER = ['index', 'calendar', 'reminders', 'settings'] as const;

const RTL_INVARIANT_KEYS: (keyof TextStyle)[] = [
  'textAlign',
  'writingDirection',
  'width',
  'alignSelf',
];

function stripRtlInvariantKeys(style: TextStyle | undefined): TextStyle {
  if (!style) {
    return {};
  }

  const next = { ...style };
  for (const key of RTL_INVARIANT_KEYS) {
    delete next[key];
  }
  return next;
}

/** Merge caller typography; RTL block invariants always applied last. */
export function mergeRtlBlockTextStyle(...styles: StyleProp<TextStyle>[]): TextStyle {
  const flat = StyleSheet.flatten(styles) ?? {};
  return {
    ...stripRtlInvariantKeys(flat),
    ...RTL_BLOCK_TEXT,
  };
}

/** Merge caller typography; RTL heading invariants always applied last. */
export function mergeRtlHeadingTextStyle(...styles: StyleProp<TextStyle>[]): TextStyle {
  const flat = StyleSheet.flatten(styles) ?? {};
  return {
    ...stripRtlInvariantKeys(flat),
    ...RTL_HEADING_TEXT,
  };
}

/** Merge caller styles; LTR value invariants always applied last. */
export function mergeLtrValueTextStyle(...styles: StyleProp<TextStyle>[]): TextStyle {
  const flat = StyleSheet.flatten(styles) ?? {};
  return {
    ...flat,
    textAlign: 'left',
    writingDirection: 'ltr',
    flexShrink: flat.flexShrink ?? 0,
  };
}

/** Dev-only: flatten styles for diagnosing overrides (no production logs). */
export function debugFlattenTextStyle(
  label: string,
  ...styles: StyleProp<TextStyle>[]
): TextStyle | undefined {
  if (!__DEV__) {
    return StyleSheet.flatten(styles);
  }

  const flat = StyleSheet.flatten(styles);
  if (flat?.textAlign && flat.textAlign !== 'right') {
    console.debug(`[RTL] ${label}: textAlign=${flat.textAlign}`);
  }
  return flat;
}
