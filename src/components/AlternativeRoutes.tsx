import { StyleSheet, Text, View } from 'react-native';

import { Card, ListItem, TrafficBadge } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Route } from '@/types/domain';
import { formatDistance, formatDuration } from '@/utils/format';

interface AlternativeRoutesProps {
  route: Route;
  selectedName: string;
  onSelect: (name: string) => void;
}

function getRelativeTime(differenceSeconds: number): string {
  if (Math.abs(differenceSeconds) < 60) {
    return 'About the same time';
  }
  if (differenceSeconds > 0) {
    return `+${formatDuration(differenceSeconds)}`;
  }
  return `${formatDuration(-differenceSeconds)} faster`;
}

function getAccessibleRelativeTime(differenceSeconds: number): string {
  if (Math.abs(differenceSeconds) < 60) {
    return 'about the same time';
  }
  return differenceSeconds > 0
    ? `${formatDuration(differenceSeconds)} slower`
    : `${formatDuration(-differenceSeconds)} faster`;
}

export function AlternativeRoutes({ route, selectedName, onSelect }: AlternativeRoutesProps) {
  const { colors } = useAppTheme();
  const routes = [route, ...(route.alternatives ?? [])];

  return (
    <Card accessibilityLabel="Choose a route">
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Choose a route</Text>
        {routes.map((candidate, index) => {
          const name = candidate.name ?? (index === 0 ? 'Recommended route' : `Alternative ${index}`);
          const differenceSeconds = candidate.durationSeconds - route.durationSeconds;
          const relativeTime = index === 0 ? 'Recommended' : getRelativeTime(differenceSeconds);
          const duration = formatDuration(candidate.durationSeconds);
          const distance = formatDistance(candidate.distanceMeters);
          const subtitle = `${relativeTime} · ${duration} · ${distance}`;
          const selected = name === selectedName;
          const accessibleRelativeTime =
            index === 0 ? 'recommended' : getAccessibleRelativeTime(differenceSeconds);

          return (
            <View key={candidate.routeId}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View
                style={[
                  styles.routeOption,
                  {
                    borderColor: selected ? colors.primary : 'transparent',
                    backgroundColor: selected ? colors.surfaceSecondary : 'transparent',
                  },
                ]}
              >
                <ListItem
                  title={name}
                  subtitle={subtitle}
                  onPress={() => onSelect(name)}
                  accessibilityLabel={`${name}, ${accessibleRelativeTime}, ${duration}, ${distance}${selected ? ', selected' : ''}`}
                  trailing={
                    candidate.congestion === 'unknown' ? undefined : (
                      <TrafficBadge
                        level={candidate.congestion}
                        accessibilityLabel={`${candidate.congestion} traffic`}
                      />
                    )
                  }
                />
              </View>
            </View>
          );
        })}
        {routes.length === 1 && (
          <Text
            accessibilityLabel="No alternative routes found for this trip"
            style={[styles.emptyMessage, { color: colors.secondaryText }]}
          >
            No alternative routes found for this trip.
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  emptyMessage: {
    fontSize: theme.typography.body,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  routeOption: {
    borderRadius: theme.radius.md,
    borderWidth: 2,
    paddingHorizontal: theme.spacing.sm,
  },
});