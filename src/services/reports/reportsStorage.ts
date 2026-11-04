import { z } from 'zod';

import { storage, storageKeys } from '@/services/storage/storage';
import type { IncidentType, LocalReport } from '@/types/domain';

const coordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const localReportSchema = z.object({
  id: z.string(),
  source: z.literal('local'),
  type: z.enum(['crash', 'roadwork', 'hazard', 'closure', 'other']),
  severity: z.enum(['low', 'moderate', 'high', 'unknown']),
  description: z.string(),
  location: coordinateSchema,
  distanceFromRouteMeters: z.number(),
  startTime: z.string().nullable(),
  expectedClearTime: z.string().nullable(),
  note: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  stillThereCount: z.number(),
  clearedCount: z.number(),
  confirmedByDevice: z.array(z.string()),
}) satisfies z.ZodType<LocalReport>;

const reportsSchema = z.array(localReportSchema);
const reportTimestampsSchema = z.array(z.number());
const REPORTS_SCHEMA_VERSION = 1;
const REPORT_TIMESTAMPS_SCHEMA_VERSION = 1;

export const REPORT_LIFETIME_MINUTES: Record<IncidentType, number> = {
  crash: 120,
  hazard: 120,
  closure: 240,
  roadwork: 480,
  other: 120,
};

export const REPORT_LABELS: Record<IncidentType, string> = {
  crash: 'Crash',
  roadwork: 'Roadworks',
  hazard: 'Hazard',
  closure: 'Road closed',
  other: 'Other',
};

export function getReports(): LocalReport[] {
  return storage.getJson(
    storageKeys.localReports,
    reportsSchema,
    [],
    REPORTS_SCHEMA_VERSION,
  );
}

export function saveReports(reports: LocalReport[]): void {
  storage.setJson(storageKeys.localReports, reports, REPORTS_SCHEMA_VERSION);
}

export function getReportTimestamps(): number[] {
  return storage.getJson(
    storageKeys.reportTimestamps,
    reportTimestampsSchema,
    [],
    REPORT_TIMESTAMPS_SCHEMA_VERSION,
  );
}

export function saveReportTimestamps(timestamps: number[]): void {
  storage.setJson(
    storageKeys.reportTimestamps,
    timestamps,
    REPORT_TIMESTAMPS_SCHEMA_VERSION,
  );
}