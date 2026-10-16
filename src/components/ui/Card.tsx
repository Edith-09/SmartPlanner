import { StyleSheet, View, type ViewProps } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ children, padded = true, style, ...viewProps }: CardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      {...viewProps}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: theme.spacing.lg,
  },
});
