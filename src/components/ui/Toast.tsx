import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

type ToastTone = 'info' | 'success' | 'error';

interface ToastProps {
  message: string;
  visible: boolean;
  tone?: ToastTone;
  accessibilityLabel?: string;
}

export function Toast({
  message,
  visible,
  tone = 'info',
  accessibilityLabel,
}: ToastProps) {
  const { colors } = useAppTheme();
  if (!visible) {
    return null;
  }

  const backgroundColor =
    tone === 'success' ? colors.success : tone === 'error' ? colors.danger : colors.text;
  const foregroundColor = tone === 'info' ? colors.surface : colors.onPrimary;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? message}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor }]}
    >
      <Text allowFontScaling style={[styles.message, { color: foregroundColor }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    borderRadius: theme.radius.md,
    maxWidth: '90%',
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.label,
    fontWeight: '600',
  },
});
