import { StyleSheet, Text, View } from 'react-native';

import { ReportListItem } from '@/components/ReportListItem';
import { Button, Card, Skeleton } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useRouteReports } from '@/hooks/useRouteReports';
import type { Route } from '@/types/domain';

interface RouteReportsProps {
  route: Route;
}

export function RouteReports({ route }: RouteReportsProps) {
  const { colors } = useAppTheme();
  const {
    reports,
    isLoading,
    isError,
    refetch,
    confirmStillThere,
    markCleared,
  } = useRouteReports(route);

  return (
    <Card accessibilityLabel="Community reports on this route">
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Community reports on this route
        </Text>
        {isLoading ? (
          <View style={styles.loading}>
            <Skeleton width="75%" />
            <Skeleton width="55%" />
          </View>
        ) : isError ? (
          <View style={styles.error}>
            <Text style={[styles.message, { color: colors.secondaryText }]}>
              Community reports could not be loaded.
            </Text>
            <Button
              title="Retry"
              variant="secondary"
              onPress={() => void refetch()}
              accessibilityLabel="Retry loading route reports"
            />
          </View>
        ) : reports.length === 0 ? (
          <Text style={[styles.message, { color: colors.secondaryText }]}>
            No community reports on this route.
          </Text>
        ) : (
          <View style={styles.list}>
            {reports.map((report) => (
              <ReportListItem
                key={report.id}
                report={report}
                distanceMeters={null}
                onStillThere={() => void confirmStillThere(report.id)}
                onCleared={() => void markCleared(report.id)}
              />
            ))}
          </View>
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
  loading: {
    gap: theme.spacing.sm,
  },
  error: {
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  message: {
    fontSize: theme.typography.body,
  },
  list: {
    gap: theme.spacing.md,
  },
});