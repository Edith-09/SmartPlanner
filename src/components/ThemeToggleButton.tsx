import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  setThemePreference,
  useThemePreference,
} from '@/services/theme/themePreference';

const nextPreference = {
  system: 'light',
  light: 'dark',
  dark: 'system',
} as const;

const preferenceLabel = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
} as const;

const preferenceIcon = {
  system: '◐',
  light: '☀',
  dark: '☾',
} as const;

export function ThemeToggleButton() {
  const { colors } = useAppTheme();
  const preference = useThemePreference();
  const label = preferenceLabel[preference];

  return (
    <Pressable
      accessibilityLabel={`Theme: ${label}. Tap to change.`}
      accessibilityRole="button"
      onPress={() => setThemePreference(nextPreference[preference])}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.text }]}>
        {preferenceIcon[preference]} {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.caption,
    fontWeight: '600',
  },
});