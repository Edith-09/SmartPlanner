import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View accessibilityRole="summary" style={styles.container} testID={testID}>
      <Text accessibilityRole="header" allowFontScaling style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text allowFontScaling style={[styles.message, { color: colors.secondaryText }]}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button onPress={onAction} title={actionLabel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.md,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
