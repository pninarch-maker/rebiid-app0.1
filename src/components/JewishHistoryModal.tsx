import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { ButtonCopy, HomeCopy } from '@/lib/rebiidCopy';
import type { KnowledgeRecord } from '@/lib/knowledgeService';
import { RtlLabelValueRow } from '@/src/components/RtlLabelValueRow';
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
      <Text style={styles.recordTitle}>{record['אירוע'] ?? ''}</Text>
      <Text style={styles.recordBody}>{record['תיאור קצר'] ?? ''}</Text>
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
          <Text style={styles.historyTitle}>{HomeCopy.historyModalTitle}</Text>
          <Text style={styles.historySubtitle}>{HomeCopy.historyModalSubtitle}</Text>

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
              <Text style={styles.empty}>{HomeCopy.emptyHistory}</Text>
            )}
          </ScrollView>

          <Pressable style={styles.historyCloseButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{ButtonCopy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
