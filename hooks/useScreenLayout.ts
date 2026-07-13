import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { Layout } from '@/constants/layout';

export function useScreenLayout() {
  const { width } = useWindowDimensions();

  return useMemo(
    () => ({
      horizontalPadding: Math.max(Layout.screenPaddingMin, width * Layout.screenPaddingRatio),
    }),
    [width],
  );
}
