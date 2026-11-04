import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { REPORT_LABELS } from '@/services/reports/reportsStorage';
import type { LocalReport } from '@/types/domain';
import { formatDistance, formatRelativeTime } from '@/utils/format';

interface ReportListItemProps {
  report: LocalReport;
  distanceMeters: number | null;
  onStillThere: () => void;
  onCleared: () => void;
}

const severityBadge = {
  high: { label: 'Major', tone: 'danger' as const },
  moderate: { label: 'Moderate', tone: 'warning' as const },
  low: { label: 'Minor', tone: 'neutral' as const },
  unknown: null,
} as const;

export function ReportListItem({
  report,
  distanceMeters,
  onStillThere,
  onCleared,
}: ReportListItemProps) {
  const { colors } = useAppTheme();
  const badge = severityBadge[report.severity];
  const hasResponded = report.confirmedByDevice.includes('this-device');
  const distanceLine = distanceMeters === null
    ? formatRelativeTime(report.createdAt)
    : `${formatDistance(distanceMeters)} away · ${formatRelativeTime(report.createdAt)}`;

  return (
    <Card accessibilityLabel={`${REPORT_LABELS[report.type]} report`}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            {REPORT_LABELS[report.type]}
          </Text>
          {badge && (
            <Badge
              label={badge.label}
              tone={badge.tone}
              accessibilityLabel={`Severity ${badge.label.toLowerCase()}`}
            />
          )}
        </View>
        {report.note.length > 0 && (
          <Text accessibilityLabel={`Note: ${report.note}`} style={[styles.note, { color: colors.text }]}>
            {report.note}
          </Text>
        )}
        <Text accessibilityLabel={distanceLine} style={[styles.meta, { color: colors.secondaryText }]}>
          {distanceLine}
        </Text>
        <View style={styles.actions}>
          <Button
            title={`Still there (${report.stillThereCount})`}
            onPress={onStillThere}
            disabled={hasResponded}
            variant="secondary"
            accessibilityLabel={`Confirm ${REPORT_LABELS[report.type]} is still there`}
          />
          <Button
            title="Cleared"
            onPress={onCleared}
            disabled={hasResponded}
            variant="secondary"
            accessibilityLabel={`Mark ${REPORT_LABELS[report.type]} as cleared`}
          />
        </View>
        {hasResponded && (
          <Text
            accessibilityLabel="You responded to this report"
            style={[styles.responded, { color: colors.secondaryText }]}
          >
            You responded to this report.
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: theme.typography.subheading,
    fontWeight: '700',
  },
  note: {
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  meta: {
    fontSize: theme.typography.label,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  responded: {
    fontSize: theme.typography.caption,
  },
});