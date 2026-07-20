import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { bentoMinTwoColumnWidth, Layout } from '@/constants/layout';

/**
 * Screen metrics from the app window’s logical width in dp only
 * (`useWindowDimensions().width`). Do not use PixelRatio, device model, or UA.
 */
export function useScreenLayout() {
  const { width } = useWindowDimensions();

  return useMemo(
    () => ({
      /** Logical window width in dp (density-independent). */
      windowWidth: width,
      horizontalPadding: Math.max(Layout.screenPaddingMin, width * Layout.screenPaddingRatio),
      /** Phones stay readable; tablets use full available width. */
      contentMaxWidth: width >= bentoMinTwoColumnWidth ? undefined : Layout.contentMaxWidth,
      /**
       * Home bento: single column below 768dp; two columns at 768dp and above.
       * Based solely on logical window width.
       */
      isTwoColumnLayout: width >= bentoMinTwoColumnWidth,
    }),
    [width],
  );
}
