import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export type TrafficLevel = 'light' | 'moderate' | 'heavy' | 'closed';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  accessibilityLabel?: string;
}

interface TrafficBadgeProps {
  level: TrafficLevel;
  label?: string;
  accessibilityLabel?: string;
}

const trafficDisplay: Record<TrafficLevel, { color: 'trafficLight' | 'trafficModerate' | 'trafficHeavy' | 'trafficClosed'; icon: string; label: string }> = {
  light: { color: 'trafficLight', icon: '✓', label: 'Light traffic' },
  moderate: { color: 'trafficModerate', icon: '!', label: 'Moderate traffic' },
  heavy: { color: 'trafficHeavy', icon: '↑', label: 'Heavy traffic' },
  closed: { color: 'trafficClosed', icon: '×', label: 'Road closed' },
};

export function Badge({ label, tone = 'neutral', accessibilityLabel }: BadgeProps) {
  const { colors } = useAppTheme();
  const toneColor =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.secondaryText;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="text"
      style={[styles.badge, { backgroundColor: `${toneColor}20` }]}
    >
      <Text allowFontScaling style={[styles.badgeText, { color: toneColor }]}>
        {label}
      </Text>
    </View>
  );
}

export function TrafficBadge({ level, label, accessibilityLabel }: TrafficBadgeProps) {
  const { colors } = useAppTheme();
  const display = trafficDisplay[level];
  const text = label ?? display.label;
  const trafficColor = colors[display.color];

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? `${text}, ${display.label}`}
      accessibilityRole="text"
      style={[styles.badge, { backgroundColor: `${trafficColor}20` }]}
    >
      <Text allowFontScaling style={[styles.trafficText, { color: trafficColor }]}>
        <Text accessibilityElementsHidden importantForAccessibility="no">
          {display.icon}{' '}
        </Text>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  trafficText: {
    fontSize: theme.typography.label,
    fontWeight: '700',
  },
});
