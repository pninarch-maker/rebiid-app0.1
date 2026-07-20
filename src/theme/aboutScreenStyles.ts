import { StyleSheet } from 'react-native';

import {
  baseScrollContent,
  buttonText,
  Layout,
  rtlCardText,
  rtlContentBlock,
  rtlHeadingText,
  rtlLabelValueRow,
  rtlSubtitle,
  rtlTitle,
  rtlValueTextRtl,
  Typography,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import type { ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createAboutStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    topBar: {
      marginBottom: Layout.headerMarginBottom,
      ...rtlContentBlock,
      gap: 12,
    },
    backButton: {
      alignSelf: 'stretch',
      paddingVertical: 4,
      minHeight: Layout.minTouchTarget,
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: Typography.body,
      fontWeight: '600',
      color: colors.primary,
      ...rtlTitle,
    },
    screenTitle: {
      fontSize: Typography.screenTitle,
      fontWeight: '700',
      color: colors.text,
      ...rtlHeadingText,
    },
    heroCard: {
      ...surfaces.baseCard,
      alignItems: 'center',
      gap: 8,
      ...rtlContentBlock,
    },
    logo: {
      width: 160,
      height: 160,
      marginBottom: 4,
    },
    appName: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      ...rtlHeadingText,
    },
    tagline: {
      fontSize: Typography.body,
      fontWeight: '600',
      color: colors.text,
      ...rtlHeadingText,
    },
    taglineEn: {
      fontSize: Typography.caption,
      color: colors.textMuted,
      alignSelf: 'stretch',
      textAlign: 'right',
      writingDirection: 'ltr',
    },
    description: {
      fontSize: Typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 22,
      marginTop: 8,
      ...rtlHeadingText,
    },
    card: {
      ...surfaces.baseCard,
      gap: 0,
    },
    metaRow: {
      ...rtlLabelValueRow,
      alignItems: 'flex-start',
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    metaRowStack: {
      paddingVertical: 12,
      gap: 4,
      ...rtlContentBlock,
    },
    metaLabel: {
      fontSize: Typography.caption,
      color: colors.textMuted,
      ...rtlSubtitle,
      flexShrink: 0,
    },
    metaValue: {
      fontSize: Typography.body,
      fontWeight: '500',
      color: colors.text,
      ...rtlValueTextRtl,
    },
    metaLinkPressable: {
      flex: 1,
      alignItems: 'flex-start',
    },
    metaLink: {
      fontSize: Typography.body,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    metaValueStack: {
      fontSize: Typography.body,
      fontWeight: '500',
      color: colors.text,
      ...rtlCardText,
    },
    metaValueStackMuted: {
      fontSize: Typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'ltr',
    },
    legalSection: {
      paddingVertical: 14,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      ...rtlContentBlock,
    },
    legalSectionLast: {
      borderBottomWidth: 0,
    },
    legalTitle: {
      fontSize: Typography.cardTitle,
      fontWeight: '600',
      color: colors.text,
      ...rtlTitle,
    },
    legalBody: {
      fontSize: Typography.bodySmall,
      color: colors.textSecondary,
      lineHeight: 22,
      ...rtlCardText,
    },
    screenSafeArea: surfaces.screenSafeArea,
    scrollContent: baseScrollContent,
  });
}

export type AboutScreenStyles = ReturnType<typeof createAboutStyles>;
