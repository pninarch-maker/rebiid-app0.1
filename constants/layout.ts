import { I18nManager, Platform, type TextStyle, type ViewStyle } from 'react-native';

import {
  mergeLtrValueTextStyle,
  mergeRtlBlockTextStyle,
  mergeRtlHeadingTextStyle,
  RTL_BLOCK_CONTAINER,
  RTL_BLOCK_TEXT,
  RTL_HEADING_TEXT,
  TAB_ROUTE_VISUAL_ORDER,
} from '@/lib/rtlArchitecture';

import { Colors } from './theme';

export {
  LTR_VALUE_TEXT,
  mergeLtrValueTextStyle,
  mergeRtlBlockTextStyle,
  mergeRtlHeadingTextStyle,
  RTL_BLOCK_CONTAINER,
  RTL_BLOCK_TEXT,
  RTL_HEADING_TEXT,
  TAB_ROUTE_VISUAL_ORDER,
} from '@/lib/rtlArchitecture';

/**
 * Horizontal flex that places the first child on the Hebrew start (right).
 * Reads current I18nManager.isRTL — does not force or change global RTL.
 * Call at style-build / render time (not once at module load).
 */
/** @deprecated Use {@link TAB_ROUTE_VISUAL_ORDER} + {@link physicalLtrRow} instead. */
export function hebrewStartFlexDirection(): 'row' | 'row-reverse' {
  return I18nManager.isRTL ? 'row' : 'row-reverse';
}

/** 8-point spacing grid — Design System v1.0 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 64,
} as const;

/** Motion tokens — 120–180ms typical, 250ms max */
export const Motion = {
  pressDurationMs: 150,
  fadeDurationMs: 180,
  pressScale: 0.96,
  pressOpacity: 0.82,
} as const;

export const Layout = {
  screenPaddingMin: 20,
  screenPaddingRatio: 0.05,
  contentMaxWidth: 560,
  scrollPaddingTop: Spacing.xl,
  scrollPaddingBottom: Spacing.xxl,
  cardRadius: 28,
  cardPadding: Spacing.lg,
  cardPaddingCompact: Spacing.sm,
  cardMarginBottom: Spacing.lg,
  cardBorderWidth: 1,
  buttonRadius: 20,
  inputRadius: 18,
  bottomSheetRadius: 32,
  floatingButtonRadius: 999,
  navButtonRadius: 20,
  headerMarginBottom: Spacing.xl,
  sectionTitleMarginBottom: Spacing.sm,
  minTouchTarget: 44,
  floatingButtonSize: 56,
} as const;

export const Typography = {
  greeting: 22,
  sectionTitle: 18,
  /** Home hero subtitle — e.g. "מה קורה היום?" */
  mainTitle: 18,
  screenTitle: 28,
  hebrewDateLarge: 44,
  gregorianDateLarge: 18,
  cardTitle: 16,
  cardBody: 15,
  reminderTitle: 16,
  body: 16,
  bodySmall: 14,
  caption: 13,
  micro: 12,
} as const;

function softShadow(color: string = Colors.shadow): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) ?? {};
}

export const cardShadow = softShadow(Colors.shadow);

export const floatingButtonShadow = Platform.select<ViewStyle>({
  ios: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
  },
  android: {
    elevation: 6,
  },
  default: {},
});

export const baseCardStyle: ViewStyle = {
  backgroundColor: Colors.card,
  borderRadius: Layout.cardRadius,
  borderWidth: Layout.cardBorderWidth,
  borderColor: Colors.cardBorder,
  padding: Layout.cardPadding,
  marginBottom: Layout.cardMarginBottom,
  ...cardShadow,
};

/** Bento card — solid surface, no glass (glass is for modals only). */
export const bentoCardStyle: ViewStyle = {
  backgroundColor: Colors.card,
  borderRadius: Layout.cardRadius,
  borderWidth: Layout.cardBorderWidth,
  borderColor: Colors.cardBorder,
  padding: Spacing.lg,
  ...cardShadow,
};

export const bentoGridGap = Spacing.md;
/** Logical window width in dp (`useWindowDimensions().width`) for two-column Home bento. */
export const bentoMinTwoColumnWidth = 768;

/** Modals / bottom sheets — subtle glass surface */
export const modalSheetStyle: ViewStyle = {
  backgroundColor: Colors.glassSurface,
  borderRadius: Layout.bottomSheetRadius,
  borderWidth: Layout.cardBorderWidth,
  borderColor: Colors.cardBorder,
  padding: Spacing.xl,
  ...cardShadow,
};

export const primaryButtonStyle: ViewStyle = {
  backgroundColor: Colors.primary,
  borderRadius: Layout.buttonRadius,
  paddingVertical: 14,
  paddingHorizontal: Spacing.xl,
  alignItems: 'center',
  minHeight: Layout.minTouchTarget,
  justifyContent: 'center',
};

export const baseScrollContent: ViewStyle = {
  paddingTop: Layout.scrollPaddingTop,
  paddingBottom: Layout.scrollPaddingBottom,
  maxWidth: Layout.contentMaxWidth,
  width: '100%',
  alignSelf: 'center',
};

/** Stretch container so right-aligned Hebrew text spans the full content width. */
export const rtlContent: ViewStyle = {
  ...RTL_BLOCK_CONTAINER,
};

/** Native-only `direction: 'ltr'` — RN Web rejects `direction` on View styles. */
const physicalLtrDirection: ViewStyle = Platform.select<ViewStyle>({
  web: {},
  default: { direction: 'ltr' },
}) ?? {};

/**
 * Row laid out in physical LTR regardless of app RTL — prevents Android mirroring
 * from flipping label/time or title/icon positions. Pair with explicit textAlign.
 */
export const physicalLtrRow: ViewStyle = {
  flexDirection: 'row',
  width: '100%',
  alignSelf: 'stretch',
  ...physicalLtrDirection,
};

/** Hebrew label on the physical right, LTR value on the physical left. */
export const physicalLabelValueRow: ViewStyle = {
  ...physicalLtrRow,
  justifyContent: 'space-between',
  alignItems: 'center',
};

/** Settings / sheet row — control on the physical left, Hebrew label on the right. */
export const physicalControlRow: ViewStyle = {
  ...physicalLtrRow,
  alignItems: 'center',
  gap: 16,
  minHeight: Layout.minTouchTarget,
};

export const hebrewText: TextStyle = {
  textAlign: RTL_BLOCK_TEXT.textAlign,
  writingDirection: RTL_BLOCK_TEXT.writingDirection,
};

/** Explicit Hebrew text alignment — does not depend on I18nManager.isRTL. */
export const rtlText: TextStyle = {
  ...RTL_BLOCK_TEXT,
};

/** Screen and section titles (right-aligned Hebrew). */
export const rtlTitle: TextStyle = {
  ...RTL_HEADING_TEXT,
};

/** Subtitles and secondary headings. */
export const rtlSubtitle: TextStyle = {
  ...RTL_HEADING_TEXT,
};

/** Body copy inside cards, lists, and detail panels. */
export const rtlCardText: TextStyle = {
  ...RTL_BLOCK_TEXT,
};

/** Centered labels on buttons; keeps RTL writing direction. */
export const buttonText: TextStyle = {
  textAlign: 'center',
  writingDirection: 'rtl',
};

/** Right-aligned text inputs and placeholders. */
export const rtlInputText: TextStyle = {
  textAlign: 'right',
  writingDirection: 'rtl',
};

/** Stretch content blocks so right-aligned text spans the card width. */
export const rtlContentBlock: ViewStyle = {
  alignSelf: 'stretch',
  width: '100%',
};

/**
 * Full-width Hebrew heading/body text for screen titles, subtitles and card copy.
 * Prefer wrapping in {@link rtlContent} when the parent may not stretch children.
 */
export const rtlHeadingText: TextStyle = {
  ...RTL_HEADING_TEXT,
};

/**
 * Physical right-to-left row — first child on the physical right, stable regardless of
 * I18nManager.isRTL (avoids Android double-mirror with flexDirection: 'row').
 */
/** @deprecated Use {@link physicalLtrRow} + explicit child order for nav controls. */
export const physicalHebrewRow: ViewStyle = Platform.select<ViewStyle>({
  web: physicalLtrRow,
  default: {
    flexDirection: 'row-reverse',
    width: '100%',
    alignSelf: 'stretch',
    ...physicalLtrDirection,
  },
}) ?? physicalLtrRow;

/** Tab bar — היום → לוח → תזכורות → הגדרות from physical right to left. */
export const physicalHebrewTabBarRow: ViewStyle = {
  ...physicalHebrewRow,
};

/** Bento / wrap grids — items flow from physical right, then wrap. */
export const physicalHebrewWrapRow: ViewStyle = {
  ...physicalHebrewRow,
  flexWrap: 'wrap',
};

/** Label on the right, value on the left, vertically centered. */
export const rtlLabelValueRow: ViewStyle = {
  ...physicalLabelValueRow,
};

/** Settings / picker row — primary label on the right, control on the left. */
export const rtlOptionRow: ViewStyle = {
  ...physicalControlRow,
  justifyContent: 'space-between',
};

/** Left-side value text (times, numbers, emails). */
export const rtlValueText: TextStyle = {
  textAlign: 'left',
  writingDirection: 'ltr',
  flexShrink: 0,
};

/** Left-side Hebrew value text. */
export const rtlValueTextRtl: TextStyle = {
  textAlign: 'left',
  writingDirection: 'rtl',
  flex: 1,
};

export const screenSafeArea: ViewStyle = {
  flex: 1,
  backgroundColor: Colors.background,
};
