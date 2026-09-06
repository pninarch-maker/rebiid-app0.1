import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import {
  baseScrollContent,
  buttonText,
  Layout,
  physicalLtrRow,
  rtlCardText,
  rtlContent,
  rtlContentBlock,
  rtlHeadingText,
  rtlInputText,
  rtlOptionRow,
  rtlSubtitle,
  rtlTitle,
  Typography,
} from '@/constants/layout';
import type { AppTheme } from '@/src/components/theme/AppThemeProvider';
import { ON_PRIMARY, type ThemedSurfaces } from '@/src/theme/themedSurfaces';

export function createSettingsStyles(theme: AppTheme, surfaces: ThemedSurfaces) {
  const { colors } = theme;

  return StyleSheet.create({
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    header: {
      marginBottom: Layout.headerMarginBottom,
      ...rtlContentBlock,
    },
    title: {
      fontSize: Typography.screenTitle,
      fontWeight: '700',
      color: colors.text,
      ...rtlHeadingText,
    },
    intro: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 24,
      ...rtlHeadingText,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      ...rtlHeadingText,
    },
    sectionHelper: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 8,
      lineHeight: 18,
      ...rtlHeadingText,
    },
    privacyNote: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
      ...rtlCardText,
    },
    privacyCard: { gap: 8 },
    privacyTagline: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      ...rtlTitle,
    },
    privacySummary: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      ...rtlCardText,
    },
    privacyBullet: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      ...rtlCardText,
    },
    accessibilityText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      ...rtlHeadingText,
    },
    accessibilityEmailLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      marginTop: 12,
      ...rtlHeadingText,
    },
    accessibilityEmailLink: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      lineHeight: 22,
      marginTop: 4,
      alignSelf: 'stretch',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'ltr',
    },
    /** Content-driven About card — never flex:1 / viewport height / large minHeight. */
    aboutCard: {
      ...surfaces.baseCard,
      // height follows children; stretch width only
      flexGrow: 0,
      flexShrink: 0,
    },
    aboutLogoWrap: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      marginBottom: 12,
    },
    aboutLogo: {
      width: 96,
      height: 96,
      alignSelf: 'center',
    },
    aboutMetaRow: {
      paddingVertical: 10,
      minHeight: Layout.minTouchTarget,
    },
    aboutNavRow: {
      ...physicalLtrRow,
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      minHeight: Layout.minTouchTarget,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    aboutNavRowPressed: {
      backgroundColor: surfaces.pressedRow,
      marginHorizontal: -Layout.cardPadding,
      paddingHorizontal: Layout.cardPadding,
    },
    aboutNavLabelWrap: {
      flex: 1,
      minWidth: 0,
    },
    aboutNavLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    aboutNavChevron: {
      fontSize: 22,
      color: colors.textMuted,
      lineHeight: 24,
      // Intentional LTR glyph on physical left inside physicalLtrRow — do not RtlText.
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    selectedValue: {
      fontSize: 15,
      color: colors.textMuted,
      marginBottom: 8,
      ...rtlSubtitle,
    },
    card: { ...surfaces.baseCard },
    optionRow: {
      ...rtlOptionRow,
      paddingVertical: 12,
    },
    optionRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    optionLabel: {
      flex: 1,
      fontSize: 17,
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
      ...rtlHeadingText,
    },
    optionLabelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    checkmark: {
      fontSize: 18,
      color: colors.primary,
      fontWeight: '700',
      width: 24,
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    checkmarkSpacer: {
      width: 24,
    },
    row: {
      ...rtlOptionRow,
    },
    /**
     * Master notifications toggle — fixed geometry so Hebrew label never jumps
     * while the Switch toggles or sync runs. physicalLtrRow: switch left, label right.
     */
    masterToggleRow: {
      ...physicalLtrRow,
      alignItems: 'center',
      gap: 16,
      minHeight: Layout.minTouchTarget,
    },
    masterToggleSwitchWrap: {
      width: 52,
      height: Layout.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    masterToggleLabelWrap: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },
    masterToggleLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'right',
      writingDirection: 'rtl',
      alignSelf: 'stretch',
    },
    rowText: { flex: 1, ...rtlContent, gap: 4 },
    rowTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      ...rtlHeadingText,
      ...rtlTitle,
    },
    rowDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      ...rtlHeadingText,
      ...rtlCardText,
    },
    customInputBlock: { marginTop: 12, gap: 8 },
    inputLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      ...rtlSubtitle,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      ...rtlInputText,
    },
    multilineInput: { minHeight: 72, textAlignVertical: 'top' },
    nestedBlock: { gap: 0 },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      ...rtlCardText,
      marginBottom: 12,
    },
    reminderItem: {
      paddingVertical: 12,
      gap: 8,
      ...rtlContentBlock,
    },
    deleteText: {
      fontSize: 14,
      color: surfaces.warningText,
      ...rtlCardText,
    },
    addButton: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      alignSelf: 'stretch',
      ...rtlContent,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    formBlock: { marginTop: 16, gap: 10 },
    monthRow: {
      ...physicalLtrRow,
      marginBottom: 4,
    },
    monthChip: {
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginStart: 8,
    },
    monthChipSelected: {
      borderColor: colors.primary,
      backgroundColor: surfaces.selectedChipBg,
    },
    monthChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      ...rtlCardText,
    },
    monthChipTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    minhagCustomTitle: { marginTop: 16 },
    saveButton: {
      marginTop: 8,
      ...surfaces.primaryButton,
    },
    saveButtonText: {
      color: ON_PRIMARY,
      fontSize: 16,
      fontWeight: '600',
      ...buttonText,
    },
    testButton: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      alignSelf: 'stretch',
      ...rtlContent,
      minHeight: 48,
      justifyContent: 'center',
    },
    testButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    scrollContent: baseScrollContent,
    screenSafeArea: surfaces.screenSafeArea,
  });
}

export type SettingsScreenStyles = ReturnType<typeof createSettingsStyles>;
