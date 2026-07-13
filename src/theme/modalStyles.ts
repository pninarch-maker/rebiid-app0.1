import { StyleSheet } from 'react-native';

import { Layout, buttonText, rtlCardText, rtlContentBlock, rtlLabelValueRow, rtlOptionRow, rtlRow, rtlSubtitle, rtlTitle, rtlValueText, rtlValueTextRtl } from '@/constants/layout';
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
      ...rtlTitle,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 16,
      ...rtlSubtitle,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
      ...rtlCardText,
    },
    section: {
      gap: 10,
      ...rtlContentBlock,
    },
    row: {
      ...rtlLabelValueRow,
      alignItems: 'center',
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
      fontSize: 14,
      color: colors.textMuted,
      ...rtlSubtitle,
      flexShrink: 0,
    },
    value: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
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
      ...rtlLabelValueRow,
      gap: 12,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      ...rtlSubtitle,
      flexShrink: 0,
    },
    detailValue: {
      fontSize: 13,
      color: colors.text,
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
