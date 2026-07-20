import { Platform, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

/**
 * REBIID RTL architecture — single source of truth for explicit physical layout.
 *
 * Native Android/iOS with `forcesRTL` (app.json + expo-localization) sets Yoga to RTL.
 * On Fabric (New Arch / SDK 54), `textAlign: 'left'|'right'` is swapped when the text
 * node's resolved layout direction is RTL — so `'right'` becomes the physical LEFT.
 * Web CSS `text-align` stays physical.
 *
 * Contract (avoids double reversal):
 * 1. Hebrew text containers use {@link physicalStyleDirection} (`direction: 'ltr'`) so
 *    `textAlign: 'right'` / `'left'` mean physical edges on every platform.
 * 2. Mixed rows use `physicalLtrRow` + documented child order — never combine native
 *    mirroring, `row-reverse`, and reversed arrays.
 * 3. Calendar columns use `mapEngineWeekToVisualOrder` inside `physicalLtrRow`.
 * 4. Do not call `I18nManager.forceRTL()` at runtime (requires restart; baked via app.json).
 */

/** Native-only `direction: 'ltr'` — RN Web rejects `direction` on View styles. */
export const physicalStyleDirection: ViewStyle =
  Platform.select<ViewStyle>({
    web: {},
    default: { direction: 'ltr' },
  }) ?? {};

/** Locked invariants for Hebrew block copy — physical right under physicalStyleDirection. */
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

/**
 * LTR technical values (times, numbers, email) on the physical left.
 * Parent row must use physical LTR direction (see physicalLtrRow).
 */
export const LTR_VALUE_TEXT: TextStyle = {
  textAlign: 'left',
  writingDirection: 'ltr',
  flexShrink: 0,
};

/**
 * LTR content that still sits on the physical right (e.g. Gregorian date under a Hebrew hero).
 * Parent must use {@link RTL_BLOCK_CONTAINER} / physicalStyleDirection.
 */
export const LTR_VALUE_TEXT_END: TextStyle = {
  textAlign: 'right',
  writingDirection: 'ltr',
  width: '100%',
  alignSelf: 'stretch',
};

/**
 * Stretch wrapper for Hebrew Text — establishes physical LTR so textAlign is not mirrored.
 * Must wrap (or be an ancestor of) ordinary Hebrew headings/body.
 */
export const RTL_BLOCK_CONTAINER: ViewStyle = {
  alignSelf: 'stretch',
  width: '100%',
  alignItems: 'stretch',
  ...physicalStyleDirection,
};

/**
 * Bottom tab route keys in physical left-to-right order.
 * Visual right → left: היום | לוח | תזכורות | הגדרות
 * (first array entry = physical left = הגדרות)
 */
export const TAB_ROUTE_PHYSICAL_LTR_ORDER = [
  'settings',
  'reminders',
  'calendar',
  'index',
] as const;

/** @deprecated Use {@link TAB_ROUTE_PHYSICAL_LTR_ORDER} */
export const TAB_ROUTE_VISUAL_ORDER = TAB_ROUTE_PHYSICAL_LTR_ORDER;

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

/** Merge caller styles; LTR value invariants (physical left) always applied last. */
export function mergeLtrValueTextStyle(...styles: StyleProp<TextStyle>[]): TextStyle {
  const flat = StyleSheet.flatten(styles) ?? {};
  return {
    ...flat,
    textAlign: 'left',
    writingDirection: 'ltr',
    flexShrink: flat.flexShrink ?? 0,
  };
}

/** LTR glyphs, physical-right alignment (hero Gregorian, etc.). */
export function mergeLtrValueEndTextStyle(...styles: StyleProp<TextStyle>[]): TextStyle {
  const flat = StyleSheet.flatten(styles) ?? {};
  return {
    ...stripRtlInvariantKeys(flat),
    ...LTR_VALUE_TEXT_END,
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
  if (flat?.textAlign && flat.textAlign !== 'right' && flat.textAlign !== 'center') {
    console.debug(`[RTL] ${label}: textAlign=${flat.textAlign}`);
  }
  return flat;
}
