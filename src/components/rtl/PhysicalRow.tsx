import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { physicalLtrRow } from '@/constants/layout';

interface PhysicalRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Physical LTR flex row — `direction: 'ltr'` so native forcesRTL does not mirror children.
 * Intentional LTR inside an RTL app: do not add row-reverse or reverse() on children.
 * Child order: first child = physical left, last child = physical right.
 */
export function PhysicalRow({ children, style }: PhysicalRowProps) {
  return <View style={[physicalLtrRow, style]}>{children}</View>;
}
