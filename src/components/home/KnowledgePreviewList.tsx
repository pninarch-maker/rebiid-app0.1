import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { rtlContent } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomeCopy } from '@/lib/rebiidCopy';
import { RtlBlock, RtlText } from '@/src/components/rtl';

interface KnowledgePreviewListProps<T> {
  items: T[];
  emptyText: string;
  expanded: boolean;
  onToggleExpand: () => void;
  renderItem: (item: T) => ReactNode;
  itemKey: (item: T, index: number) => string;
  previewLimit?: number;
}

const DEFAULT_PREVIEW_LIMIT = 3;

export function KnowledgePreviewList<T>({
  items,
  emptyText,
  expanded,
  onToggleExpand,
  renderItem,
  itemKey,
  previewLimit = DEFAULT_PREVIEW_LIMIT,
}: KnowledgePreviewListProps<T>) {
  const theme = useAppTheme();

  if (items.length === 0) {
    return (
      <RtlBlock style={rtlContent}>
        <RtlText style={[styles.empty, { color: theme.colors.textSecondary }]}>{emptyText}</RtlText>
      </RtlBlock>
    );
  }

  const visibleItems = expanded ? items : items.slice(0, previewLimit);

  return (
    <RtlBlock style={styles.list}>
      {visibleItems.map((item, index) => (
        <RtlBlock
          key={itemKey(item, index)}
          style={[
            styles.item,
            index < visibleItems.length - 1 && {
              borderBottomColor: theme.colors.divider,
              borderBottomWidth: 1,
            },
          ]}>
          <RtlBlock style={rtlContent}>{renderItem(item)}</RtlBlock>
        </RtlBlock>
      ))}
      {items.length > previewLimit ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToggleExpand}
          style={({ pressed }) => [
            styles.showMore,
            pressed && { opacity: theme.motion.pressOpacity },
          ]}>
          <RtlText style={[styles.showMoreText, { color: theme.colors.primary }]}>
            {expanded ? 'הצג פחות' : HomeCopy.showMore}
          </RtlText>
        </Pressable>
      ) : null}
    </RtlBlock>
  );
}

export function KnowledgeItemTitle({ children }: { children: string }) {
  const theme = useAppTheme();
  return (
    <RtlText variant="heading" style={[styles.itemTitle, { color: theme.colors.text }]}>
      {children}
    </RtlText>
  );
}

export function KnowledgeItemBody({ children }: { children: string }) {
  const theme = useAppTheme();
  return (
    <RtlText style={[styles.itemBody, { color: theme.colors.textSecondary }]}>{children}</RtlText>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'stretch',
    width: '100%',
  },
  item: {
    gap: 3,
    paddingVertical: 8,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  showMore: {
    marginTop: 8,
    paddingVertical: 6,
    alignSelf: 'stretch',
    minHeight: 44,
    justifyContent: 'center',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemBody: {
    fontSize: 12,
    lineHeight: 20,
  },
});
