import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export function ListItem({
  title,
  subtitle,
  onPress,
  leading,
  trailing,
  accessibilityLabel,
  testID,
}: ListItemProps) {
  const { colors } = useAppTheme();
  const content = (
    <>
      {leading}
      <View style={styles.copy}>
        <Text allowFontScaling style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text allowFontScaling style={[styles.subtitle, { color: colors.secondaryText }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </>
  );

  if (!onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 56,
    paddingVertical: theme.spacing.sm,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: theme.typography.label,
  },
  pressed: {
    opacity: 0.75,
  },
});
