import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportForm } from '@/components/ReportForm';
import { ReportListItem } from '@/components/ReportListItem';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useReports } from '@/hooks/useReports';
import { ApiClientError } from '@/services/api/apiClient';
import type { BoundingBox } from '@/types/domain';
import { haversineDistanceMeters } from '@/utils/geo';

export default function ReportsScreen() {
  const { colors } = useAppTheme();
  const location = useCurrentLocation();
  const bounds = useMemo<BoundingBox | null>(() => {
    if (location.status !== 'ready' || !location.coordinate) {
      return null;
    }

    return {
      south: location.coordinate.latitude - 0.25,
      north: location.coordinate.latitude + 0.25,
      west: location.coordinate.longitude - 0.25,
      east: location.coordinate.longitude + 0.25,
    };
  }, [location.coordinate, location.status]);
  const {
    reports,
    isLoading,
    isError,
    error,
    refetch,
    submitReport,
    confirmStillThere,
    markCleared,
  } = useReports(bounds);
  const reportsWithDistance = useMemo(
    () => {
      const entries = reports.map((report) => ({
        report,
        distanceMeters: location.status === 'ready' && location.coordinate
          ? haversineDistanceMeters(location.coordinate, report.location)
          : null,
      }));
      return entries.sort((first, second) => {
        if (first.distanceMeters === null) {
          return second.distanceMeters === null ? 0 : 1;
        }
        if (second.distanceMeters === null) {
          return -1;
        }
        return first.distanceMeters - second.distanceMeters;
      });
    },
    [location.coordinate, location.status, reports],
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Smart Transport Planner</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Reports</Text>
          <Text style={[styles.caption, { color: colors.secondaryText }]}>Reports are shared with everyone using the app.</Text>
        </View>

        {location.status === 'loading' && (
          <Text accessibilityLabel="Finding your location" style={[styles.locationMessage, { color: colors.secondaryText }]}>
            Finding your location…
          </Text>
        )}
        {(location.status === 'denied' ||
          location.status === 'blocked' ||
          location.status === 'error') && (
          <ErrorState
            message={location.message ?? 'Current location is unavailable.'}
            onRetry={location.retry}
          />
        )}

        <ReportForm location={location.status === 'ready' ? location.coordinate : null} onSubmit={submitReport} />

        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
            Active reports
          </Text>
        </View>
        {isLoading ? (
          <View style={styles.skeletonGroup}>
            <Skeleton height={92} />
            <Skeleton height={92} />
          </View>
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiClientError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : 'Shared reports could not be loaded.'
            }
            onRetry={() => void refetch()}
          />
        ) : reportsWithDistance.length === 0 ? (
          <EmptyState
            title="No active reports"
            message="Reports you submit will appear here until they expire."
          />
        ) : (
          reportsWithDistance.map(({ report, distanceMeters }) => (
            <ReportListItem
              key={report.id}
              report={report}
              distanceMeters={distanceMeters}
              onStillThere={() => confirmStillThere(report.id)}
              onCleared={() => markCleared(report.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  eyebrow: {
    fontSize: theme.typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: theme.typography.display,
    fontWeight: '700',
  },
  caption: {
    fontSize: theme.typography.label,
  },
  locationMessage: {
    fontSize: theme.typography.body,
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.heading,
    fontWeight: '700',
  },
  skeletonGroup: {
    gap: theme.spacing.md,
  },
});
