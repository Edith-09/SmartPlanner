import { useColorScheme } from 'react-native';

import { colorPalettes, type ColorScheme } from '@/config/theme';
import { useThemePreference } from '@/services/theme/themePreference';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const preference = useThemePreference();
  const colorScheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  return {
    colorScheme,
    colors: colorPalettes[colorScheme],
  } as const;
}
