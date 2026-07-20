import { StyleSheet } from 'react-native';

import { Layout, buttonText, physicalLabelValueRow, rtlCardText, rtlContentBlock, rtlHeadingText, rtlSubtitle, rtlTitle, rtlValueTextRtl } from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import { ON_PRIMARY, type ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createCenteredModalStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      ...surfaces.modalSheet,
      maxHeight: '80%',
      alignSelf: 'stretch',
      ...rtlContentBlock,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      ...rtlHeadingText,
      ...rtlTitle,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 16,
      ...rtlHeadingText,
      ...rtlSubtitle,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
      ...rtlHeadingText,
      ...rtlCardText,
    },
    section: {
      gap: 10,
      ...rtlContentBlock,
    },
    row: {
      ...physicalLabelValueRow,
      gap: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    label: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      ...rtlHeadingText,
      ...rtlSubtitle,
    },
    value: {
      flexShrink: 0,
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
      textAlign: 'left',
      writingDirection: 'rtl',
      ...rtlValueTextRtl,
    },
    time: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    empty: {
      fontSize: 15,
      color: colors.textSecondary,
      ...rtlCardText,
      marginBottom: 8,
    },
    footerNote: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
      ...rtlCardText,
    },
    zmanimContext: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
      ...rtlCardText,
    },
    closeButton: {
      ...surfaces.primaryButton,
      marginTop: 20,
    },
    closeButtonText: {
      color: ON_PRIMARY,
      fontSize: 16,
      fontWeight: '600',
      ...buttonText,
    },
    scrollArea: {
      flexGrow: 0,
    },
    recordCard: {
      ...rtlContentBlock,
      gap: 8,
      paddingVertical: 14,
    },
    recordCardBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    recordTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      ...rtlTitle,
    },
    recordBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      ...rtlCardText,
    },
    detailRow: {
      ...physicalLabelValueRow,
      gap: 12,
    },
    detailLabel: {
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      ...rtlHeadingText,
      ...rtlSubtitle,
    },
    detailValue: {
      flexShrink: 0,
      fontSize: 13,
      color: colors.text,
      textAlign: 'left',
      writingDirection: 'rtl',
      ...rtlValueTextRtl,
    },
    historyOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: Layout.screenPaddingMin,
    },
    historyCard: {
      ...surfaces.modalSheet,
      maxHeight: '85%',
      ...rtlContentBlock,
    },
    historyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      ...rtlTitle,
    },
    historySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      ...rtlSubtitle,
    },
    historyCloseButton: {
      ...surfaces.primaryButton,
      marginTop: 16,
    },
  });
}

export type CenteredModalStyles = ReturnType<typeof createCenteredModalStyles>;
