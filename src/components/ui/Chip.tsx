import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const { colors } = useAppTheme();
  const content = (
    <Text
      allowFontScaling
      style={[
        styles.label,
        { color: selected ? colors.onPrimary : colors.text },
      ]}
    >
      {label}
    </Text>
  );

  if (!onPress) {
    return (
      <Text
        accessibilityLabel={accessibilityLabel ?? label}
        style={[
          styles.chip,
          styles.staticChip,
          { backgroundColor: selected ? colors.primary : colors.surfaceSecondary },
        ]}
      >
        {label}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? colors.primary : colors.surfaceSecondary },
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  staticChip: {
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: theme.typography.label,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
