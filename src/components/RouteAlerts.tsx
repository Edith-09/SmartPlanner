import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, ListItem } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { IncidentSeverity, Route } from '@/types/domain';

interface RouteAlertsProps {
  route: Route;
}

const severityBadge: Partial<
  Record<IncidentSeverity, { label: string; tone: 'danger' | 'warning' | 'neutral' }>
> = {
  high: { label: 'Major', tone: 'danger' },
  moderate: { label: 'Moderate', tone: 'warning' },
  low: { label: 'Minor', tone: 'neutral' },
};

export function RouteAlerts({ route }: RouteAlertsProps) {
  const { colors } = useAppTheme();
  const incidents = route.incidents ?? [];

  return (
    <Card accessibilityLabel="Traffic alerts on the route">
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>On your route</Text>
        {incidents.length === 0 ? (
          <Text
            accessibilityLabel="No incidents reported on this route"
            style={[styles.emptyMessage, { color: colors.secondaryText }]}
          >
            No incidents reported on this route.
          </Text>
        ) : (
          incidents.map((incident, index) => {
            const badge = severityBadge[incident.severity];
            return (
              <View key={incident.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <ListItem
                  title={incident.description}
                  accessibilityLabel={`${incident.description}${badge ? `, ${badge.label}` : ''}`}
                  trailing={
                    badge ? (
                      <Badge
                        label={badge.label}
                        tone={badge.tone}
                        accessibilityLabel={`Severity ${badge.label.toLowerCase()}`}
                      />
                    ) : undefined
                  }
                />
              </View>
            );
          })
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
});