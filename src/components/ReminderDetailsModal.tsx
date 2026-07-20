import { Modal, Pressable, ScrollView, View } from 'react-native';

import { rtlContent } from '@/constants/layout';
import { ButtonCopy, ModalCopy } from '@/lib/rebiidCopy';
import type { ReminderDetailsData } from '@/lib/reminderDetails';
import { RtlLabelValueRow } from '@/src/components/RtlLabelValueRow';
import { RtlCenteredText, RtlText } from '@/src/components/rtl';
import { createCenteredModalStyles } from '@/src/theme/modalStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

interface ReminderDetailsModalProps {
  visible: boolean;
  reminder: ReminderDetailsData | null;
  onClose: () => void;
}

export function ReminderDetailsModal({
  visible,
  reminder,
  onClose,
}: ReminderDetailsModalProps) {
  const styles = useThemeStyles(createCenteredModalStyles);

  if (!reminder) {
    return null;
  }

  const hasExtraDetails = Boolean(
    reminder.notificationTime || reminder.relatedZman || reminder.zmanimCityLabel,
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={rtlContent}>
              <RtlText variant="heading" style={styles.title}>
                {reminder.title}
              </RtlText>
              <RtlText style={styles.message}>{reminder.message}</RtlText>
            </View>

            <View style={styles.section}>
              <RtlLabelValueRow bordered label={ModalCopy.hebrewDate} value={reminder.hebrewDate} />
              <RtlLabelValueRow
                bordered
                label={ModalCopy.gregorianDate}
                value={reminder.gregorianDate}
                valueDirection="ltr"
              />
              <RtlLabelValueRow bordered label={ModalCopy.dayOfWeek} value={reminder.dayOfWeek} />
              {reminder.notificationTime ? (
                <RtlLabelValueRow
                  bordered
                  label={ModalCopy.notificationTime}
                  value={reminder.notificationTime}
                  valueDirection="ltr"
                />
              ) : null}
              {reminder.zmanimCityLabel ? (
                <RtlText style={styles.zmanimContext}>{reminder.zmanimCityLabel}</RtlText>
              ) : null}
              {reminder.relatedZman ? (
                <RtlLabelValueRow bordered label={ModalCopy.relatedZman} value={reminder.relatedZman} />
              ) : null}
            </View>

            {!hasExtraDetails ? (
              <RtlText style={styles.footerNote}>{ModalCopy.noExtraDetails}</RtlText>
            ) : null}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <RtlCenteredText style={styles.closeButtonText}>{ButtonCopy.close}</RtlCenteredText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
