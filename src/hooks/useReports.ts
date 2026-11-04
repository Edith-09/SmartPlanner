import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getReportTimestamps,
  getReports,
  REPORT_LABELS,
  REPORT_LIFETIME_MINUTES,
  saveReportTimestamps,
  saveReports,
} from '@/services/reports/reportsStorage';
import type { Coordinate, IncidentType, LocalReport } from '@/types/domain';

const reportsQueryKey = ['reports'] as const;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60_000;
const DEVICE_CONFIRMATION_ID = 'this-device';

function getRecentReportTimestamps(): number[] {
  const now = Date.now();
  return getReportTimestamps().filter((timestamp) => timestamp > now - RATE_WINDOW_MS);
}

const isActiveReport = (report: LocalReport, now: number): boolean =>
  Date.parse(report.expiresAt) > now && report.clearedCount <= report.stillThereCount;

const severityByType: Record<IncidentType, LocalReport['severity']> = {
  crash: 'high',
  closure: 'high',
  hazard: 'moderate',
  roadwork: 'low',
  other: 'low',
};

export function useReports() {
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: reportsQueryKey,
    queryFn: () => {
      const reports = getReports();
      const activeReports = reports.filter((report) => isActiveReport(report, Date.now()));
      if (activeReports.length !== reports.length) {
        saveReports(activeReports);
      }
      return activeReports;
    },
    refetchInterval: 60_000,
  });
  const reports = reportsQuery.data ?? [];

  const updateReports = (updatedReports: LocalReport[]): void => {
    saveReports(updatedReports);
    queryClient.setQueryData(reportsQueryKey, updatedReports);
  };

  const currentReports = (): LocalReport[] =>
    queryClient.getQueryData<LocalReport[]>(reportsQueryKey) ?? reports;

  const remainingSubmissions = Math.max(0, RATE_LIMIT - getRecentReportTimestamps().length);

  const submitReport = (input: {
    type: IncidentType;
    note: string;
    location: Coordinate;
  }): { ok: boolean; reason?: 'rate-limit' } => {
    const submissionTime = Date.now();
    const timestamps = getReportTimestamps().filter(
      (timestamp) => timestamp > submissionTime - RATE_WINDOW_MS,
    );
    saveReportTimestamps(timestamps);
    if (timestamps.length >= RATE_LIMIT) {
      return { ok: false, reason: 'rate-limit' };
    }

    const createdAt = new Date(submissionTime).toISOString();
    const report: LocalReport = {
      id: `${submissionTime.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      source: 'local',
      type: input.type,
      severity: severityByType[input.type],
      description: REPORT_LABELS[input.type],
      location: input.location,
      distanceFromRouteMeters: 0,
      startTime: createdAt,
      expectedClearTime: null,
      note: input.note.trim().slice(0, 120),
      createdAt,
      expiresAt: new Date(
        submissionTime + REPORT_LIFETIME_MINUTES[input.type] * 60_000,
      ).toISOString(),
      stillThereCount: 0,
      clearedCount: 0,
      confirmedByDevice: [],
    };
    updateReports([...currentReports(), report]);
    saveReportTimestamps([...timestamps, submissionTime]);
    return { ok: true };
  };

  const confirmStillThere = (id: string): void => {
    updateReports(
      currentReports().map((report) => {
        if (
          report.id !== id ||
          report.confirmedByDevice.includes(DEVICE_CONFIRMATION_ID)
        ) {
          return report;
        }
        return {
          ...report,
          stillThereCount: report.stillThereCount + 1,
          confirmedByDevice: [...report.confirmedByDevice, DEVICE_CONFIRMATION_ID],
          expiresAt: new Date(Date.parse(report.expiresAt) + 30 * 60_000).toISOString(),
        };
      }),
    );
  };

  const markCleared = (id: string): void => {
    const updatedReports = currentReports().map((report) => {
      if (
        report.id !== id ||
        report.confirmedByDevice.includes(DEVICE_CONFIRMATION_ID)
      ) {
        return report;
      }
      return {
        ...report,
        clearedCount: report.clearedCount + 1,
        confirmedByDevice: [...report.confirmedByDevice, DEVICE_CONFIRMATION_ID],
      };
    });
    updateReports(updatedReports.filter((report) => isActiveReport(report, Date.now())));
  };

  return {
    reports,
    submitReport,
    confirmStillThere,
    markCleared,
    remainingSubmissions,
  };
}