import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, TrafficBadge } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Route } from '@/types/domain';
import { formatDistance, formatDuration, formatRelativeTime } from '@/utils/format';

interface RouteStatusCardProps {
  route: Route;
  destinationName: string;
  updatedAt: number;
}

const headlines = {
  light: 'Clear roads ahead',
  moderate: 'Some delays on this route',
  heavy: 'Heavy traffic on this route',
  unknown: 'Traffic status unavailable',
} as const;

function formatArrivalTime(timestamp: number): string {
  const arrival = new Date(timestamp);
  const hours = String(arrival.getHours()).padStart(2, '0');
  const minutes = String(arrival.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function RouteStatusCard({ route, destinationName, updatedAt }: RouteStatusCardProps) {
  const { colors } = useAppTheme();
  const delayLine =
    route.trafficDelaySeconds < 60
      ? 'No delay compared with usual'
      : `${formatDuration(route.trafficDelaySeconds)} slower than usual`;
  const arrivalTime = formatArrivalTime(updatedAt + route.durationSeconds * 1_000);

  return (
    <Card accessibilityLabel={`Route status to ${destinationName}`}>
      <View style={styles.content}>
        {route.congestion === 'unknown' ? (
          <Badge label="Traffic unknown" accessibilityLabel="Traffic status unavailable" />
        ) : (
          <TrafficBadge level={route.congestion} />
        )}
        <Text
          accessibilityLabel={headlines[route.congestion]}
          accessibilityRole="header"
          style={[styles.headline, { color: colors.text }]}
        >
          {headlines[route.congestion]}
        </Text>
        <Text
          accessibilityLabel={`Travel time ${formatDuration(route.durationSeconds)}`}
          style={[styles.travelTime, { color: colors.primary }]}
        >
          {formatDuration(route.durationSeconds)}
        </Text>
        <Text
          accessibilityLabel={delayLine}
          style={[styles.delay, { color: colors.secondaryText }]}
        >
          {delayLine}
        </Text>
        <View
          accessibilityLabel="Route details"
          style={[styles.stats, { borderTopColor: colors.border }]}
        >
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Usually</Text>
            <Text
              accessibilityLabel={`Usual travel time ${formatDuration(route.staticDurationSeconds)}`}
              style={[styles.statValue, { color: colors.text }]}
            >
              {formatDuration(route.staticDurationSeconds)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Distance</Text>
            <Text
              accessibilityLabel={`Distance ${formatDistance(route.distanceMeters)}`}
              style={[styles.statValue, { color: colors.text }]}
            >
              {formatDistance(route.distanceMeters)}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Arrive</Text>
            <Text
              accessibilityLabel={`Estimated arrival at ${arrivalTime}`}
              style={[styles.statValue, { color: colors.text }]}
            >
              {arrivalTime}
            </Text>
          </View>
        </View>
        <Text
          accessibilityLabel={`Updated ${formatRelativeTime(updatedAt)}`}
          style={[styles.updated, { color: colors.mutedText }]}
        >
          Updated {formatRelativeTime(updatedAt)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  headline: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
  },
  travelTime: {
    fontSize: theme.typography.display,
    fontWeight: '700',
  },
  delay: {
    fontSize: theme.typography.body,
  },
  stats: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
  },
  stat: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.caption,
  },
  statValue: {
    fontSize: theme.typography.label,
    fontWeight: '700',
  },
  updated: {
    fontSize: theme.typography.caption,
  },
});