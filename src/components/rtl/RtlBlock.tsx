import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { RTL_BLOCK_CONTAINER } from '@/lib/rtlArchitecture';

interface RtlBlockProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Full-width stretch container for right-aligned Hebrew text groups.
 * Sets physical LTR direction so Fabric does not swap textAlign left/right.
 */
export function RtlBlock({ children, style }: RtlBlockProps) {
  return <View style={[RTL_BLOCK_CONTAINER, style]}>{children}</View>;
}
