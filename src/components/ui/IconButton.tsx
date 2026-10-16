import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface IconButtonProps {
  icon: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  testID,
  style,
}: IconButtonProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surfaceSecondary, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text allowFontScaling style={[styles.icon, { color: colors.text }]}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: {
    fontSize: theme.typography.subheading,
    fontWeight: '600',
    textAlign: 'center',
  },
});
