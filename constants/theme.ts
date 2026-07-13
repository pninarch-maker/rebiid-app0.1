/**
 * REBIID Design System v1.0 — compatibility re-exports.
 *
 * Color primitives and semantic tokens live in `./tokens` (dependency leaf).
 * This module must only import from tokens — never the reverse.
 */
export {
  Colors,
  ColorsDark,
  ColorsLight,
  ColorTokens,
  LayoutTokens,
  MotionTokens,
  RadiusTokens,
  SpacingTokens,
  TimeThemeBackgrounds,
  TypographyTokens,
  createElevation,
  getPalette,
  resolveTimeTheme,
  type AppColors,
  type ThemeMode,
  type TimeThemeKey,
} from './tokens';
