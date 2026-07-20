import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { rtlContent } from '@/constants/layout';
import { ButtonCopy, ModalCopy } from '@/lib/rebiidCopy';
import type { ReminderDetailsData } from '@/lib/reminderDetails';
import { RtlLabelValueRow } from '@/src/components/RtlLabelValueRow';
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
              <Text style={styles.title}>{reminder.title}</Text>
              <Text style={styles.message}>{reminder.message}</Text>
            </View>

            <View style={styles.section}>
              <RtlLabelValueRow bordered label={ModalCopy.hebrewDate} value={reminder.hebrewDate} />
              <RtlLabelValueRow bordered label={ModalCopy.gregorianDate} value={reminder.gregorianDate} />
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
                <Text style={styles.zmanimContext}>{reminder.zmanimCityLabel}</Text>
              ) : null}
              {reminder.relatedZman ? (
                <RtlLabelValueRow bordered label={ModalCopy.relatedZman} value={reminder.relatedZman} />
              ) : null}
            </View>

            {!hasExtraDetails ? (
              <Text style={styles.footerNote}>{ModalCopy.noExtraDetails}</Text>
            ) : null}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{ButtonCopy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
