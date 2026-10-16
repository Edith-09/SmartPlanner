import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface TextFieldProps extends Omit<TextInputProps, 'accessibilityLabel'> {
  label: string;
  error?: string;
  helperText?: string;
  accessibilityLabel?: string;
}

export function TextField({
  label,
  error,
  helperText,
  accessibilityLabel,
  style,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text allowFontScaling style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: inputProps.editable === false }}
        allowFontScaling
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
          style,
        ]}
      />
      {(error || helperText) && (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          allowFontScaling
          style={[styles.hint, { color: error ? colors.danger : colors.secondaryText }]}
        >
          {error ?? helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.label,
    fontWeight: '600',
  },
  input: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    fontSize: theme.typography.body,
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  hint: {
    fontSize: theme.typography.caption,
  },
});
