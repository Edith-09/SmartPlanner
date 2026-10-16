import { useEffect, useState } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  radius?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = theme.radius.sm,
  style,
  accessibilityLabel = 'Loading',
}: SkeletonProps) {
  const { colors } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0.42));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[
        styles.skeleton,
        { backgroundColor: colors.surfaceSecondary, borderRadius: radius, height, opacity, width },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
