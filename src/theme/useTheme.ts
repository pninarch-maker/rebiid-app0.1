import { useMemo } from 'react';

import { useAppTheme, type AppTheme } from '@/hooks/useAppTheme';

import { getThemedSurfaces, type ThemedSurfaces } from './themedSurfaces';

export type Theme = AppTheme & {
  surfaces: ThemedSurfaces;
  colors: AppTheme['colors'];
};

export function useTheme(): Theme {
  const theme = useAppTheme();
  const surfaces = useMemo(() => getThemedSurfaces(theme), [theme]);

  return {
    ...theme,
    colors: theme.colors,
    surfaces,
  };
}

export function useThemeStyles<T>(
  factory: (theme: AppTheme, surfaces: ThemedSurfaces) => T,
): T {
  const theme = useAppTheme();
  const surfaces = useMemo(() => getThemedSurfaces(theme), [theme]);
  return useMemo(() => factory(theme, surfaces), [factory, surfaces, theme]);
}

export { ON_PRIMARY } from './themedSurfaces';
export type { ThemedSurfaces } from './themedSurfaces';
