import { Modal, Pressable, ScrollView, View } from 'react-native';

import { ButtonCopy, HomeCopy } from '@/lib/rebiidCopy';
import type { KnowledgeRecord } from '@/lib/knowledgeService';
import { RtlLabelValueRow } from '@/src/components/RtlLabelValueRow';
import { RtlCenteredText, RtlText } from '@/src/components/rtl';
import { createCenteredModalStyles } from '@/src/theme/modalStyles';
import { useThemeStyles } from '@/src/theme/useTheme';

interface JewishHistoryModalProps {
  visible: boolean;
  records: KnowledgeRecord[];
  onClose: () => void;
}

function HistoryDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) {
    return null;
  }

  return <RtlLabelValueRow label={label} value={value} />;
}

function HistoryRecordCard({
  record,
  index,
  total,
  styles,
}: {
  record: KnowledgeRecord;
  index: number;
  total: number;
  styles: ReturnType<typeof createCenteredModalStyles>;
}) {
  return (
    <View style={[styles.recordCard, index < total - 1 && styles.recordCardBorder]}>
      <RtlText variant="heading" style={styles.recordTitle}>
        {record['אירוע'] ?? ''}
      </RtlText>
      <RtlText style={styles.recordBody}>{record['תיאור קצר'] ?? ''}</RtlText>
      <HistoryDetailRow label="שנה / תקופה" value={record['שנה / תקופה'] ?? ''} />
      <HistoryDetailRow label="קטגוריה" value={record['קטגוריה'] ?? ''} />
      <HistoryDetailRow label="סוג תאריך" value={record['סוג תאריך'] ?? ''} />
      <HistoryDetailRow label="מקור" value={record['מקור'] ?? ''} />
    </View>
  );
}

export function JewishHistoryModal({ visible, records, onClose }: JewishHistoryModalProps) {
  const styles = useThemeStyles(createCenteredModalStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.historyOverlay}>
        <View style={styles.historyCard}>
          <RtlText variant="heading" style={styles.historyTitle}>
            {HomeCopy.historyModalTitle}
          </RtlText>
          <RtlText style={styles.historySubtitle}>{HomeCopy.historyModalSubtitle}</RtlText>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
            {records.length > 0 ? (
              records.map((record, index) => (
                <HistoryRecordCard
                  key={`${record['אירוע']}-${record['שנה / תקופה']}-${index}`}
                  record={record}
                  index={index}
                  total={records.length}
                  styles={styles}
                />
              ))
            ) : (
              <RtlText style={styles.empty}>{HomeCopy.emptyHistory}</RtlText>
            )}
          </ScrollView>

          <Pressable style={styles.historyCloseButton} onPress={onClose}>
            <RtlCenteredText style={styles.closeButtonText}>{ButtonCopy.close}</RtlCenteredText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
