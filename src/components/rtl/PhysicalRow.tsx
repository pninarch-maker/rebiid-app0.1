import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { physicalLtrRow } from '@/constants/layout';

interface PhysicalRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Physical LTR flex row — immune to native RTL mirroring on Android.
 * Document child order: first child = physical left, last = physical right.
 */
export function PhysicalRow({ children, style }: PhysicalRowProps) {
  return <View style={[physicalLtrRow, style]}>{children}</View>;
}
