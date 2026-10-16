import { useColorScheme } from 'react-native';

import { colorPalettes, type ColorScheme } from '@/config/theme';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const colorScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';

  return {
    colorScheme,
    colors: colorPalettes[colorScheme],
  } as const;
}
