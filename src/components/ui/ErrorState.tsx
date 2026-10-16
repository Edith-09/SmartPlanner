import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
  testID,
}: ErrorStateProps) {
  const { colors } = useAppTheme();

  return (
    <View accessibilityRole="alert" style={styles.container} testID={testID}>
      <Text accessibilityRole="header" allowFontScaling style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text allowFontScaling style={[styles.message, { color: colors.secondaryText }]}>
        {message}
      </Text>
      {onRetry ? <Button onPress={onRetry} title={retryLabel} variant="secondary" /> : null}
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
