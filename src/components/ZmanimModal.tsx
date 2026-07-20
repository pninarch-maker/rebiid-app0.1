import { Modal, Pressable, ScrollView, View } from 'react-native';

import { ButtonCopy } from '@/lib/rebiidCopy';
import type { ZmanimDisplayRow } from '@/lib/zmanimDisplay';
import { ZmanimRowList } from '@/src/components/ZmanimRowList';
import { RtlCenteredText, RtlText } from '@/src/components/rtl';
import { createCenteredModalStyles } from '@/src/theme/modalStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

interface ZmanimModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  rows: ZmanimDisplayRow[];
  onClose: () => void;
}

export function ZmanimModal({ visible, title, subtitle, rows, onClose }: ZmanimModalProps) {
  const styles = useThemeStyles(createCenteredModalStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <RtlText variant="heading" style={styles.title}>
              {title}
            </RtlText>
            {subtitle ? <RtlText style={styles.subtitle}>{subtitle}</RtlText> : null}

            <ZmanimRowList rows={rows} emptyText="אין זמנים זמינים ליום זה." />
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <RtlCenteredText style={styles.closeButtonText}>{ButtonCopy.close}</RtlCenteredText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
