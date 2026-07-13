import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { rtlHeadingText } from '@/constants/layout';
import { useAppTheme } from '@/hooks/useAppTheme';
import { HomeCopy } from '@/lib/rebiidCopy';

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
    return <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>{emptyText}</Text>;
  }

  const visibleItems = expanded ? items : items.slice(0, previewLimit);

  return (
    <View style={styles.list}>
      {visibleItems.map((item, index) => (
        <View
          key={itemKey(item, index)}
          style={[
            styles.item,
            index < visibleItems.length - 1 && {
              borderBottomColor: theme.colors.divider,
              borderBottomWidth: 1,
            },
          ]}>
          {renderItem(item)}
        </View>
      ))}
      {items.length > previewLimit ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToggleExpand}
          style={({ pressed }) => [
            styles.showMore,
            pressed && { opacity: theme.motion.pressOpacity },
          ]}>
          <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>
            {expanded ? 'הצג פחות' : HomeCopy.showMore}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function KnowledgeItemTitle({ children }: { children: string }) {
  const theme = useAppTheme();
  return <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{children}</Text>;
}

export function KnowledgeItemBody({ children }: { children: string }) {
  const theme = useAppTheme();
  return (
    <Text style={[styles.itemBody, { color: theme.colors.textSecondary }]}>{children}</Text>
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
    alignSelf: 'stretch',
    width: '100%',
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    ...rtlHeadingText,
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
    ...rtlHeadingText,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    ...rtlHeadingText,
  },
  itemBody: {
    fontSize: 12,
    lineHeight: 20,
    ...rtlHeadingText,
  },
});
