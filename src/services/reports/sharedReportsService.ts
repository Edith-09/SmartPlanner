import { z } from 'zod';

import { ApiClientError, apiClient } from '@/services/api/apiClient';
import { getDeviceId } from '@/services/reports/deviceId';
import { REPORT_LABELS } from '@/services/reports/reportsStorage';
import type { BoundingBox, IncidentType, LocalReport } from '@/types/domain';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
const sharedReportsConfigurationError =
  'Shared reports are not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to your .env file and restart Expo with: npx expo start -c';

const reportRowSchema = z.object({
  id: z.string(),
  type: z.string(),
  note: z.string(),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  created_at: z.string(),
  expires_at: z.string(),
  still_there_count: z.number().finite(),
  cleared_count: z.number().finite(),
  is_mine: z.boolean(),
  has_voted: z.boolean(),
});

const reportTypeSchema = z.enum(['crash', 'roadwork', 'hazard', 'closure', 'other']);

const severityByType: Record<IncidentType, LocalReport['severity']> = {
  crash: 'high',
  closure: 'high',
  hazard: 'moderate',
  roadwork: 'low',
  other: 'low',
};

interface SubmitSharedReportInput {
  type: IncidentType;
  note: string;
  location: { latitude: number; longitude: number };
}

interface GetReportsRow {
  id: string;
  type: string;
  note: string;
  latitude: number;
  longitude: number;
  created_at: string;
  expires_at: string;
  still_there_count: number;
  cleared_count: number;
  is_mine: boolean;
  has_voted: boolean;
}

function assertConfigured(): void {
  if (!supabaseUrl || !supabaseKey) {
    throw new ApiClientError(sharedReportsConfigurationError, 'forbidden');
  }
}

function rpcUrl(name: string): string {
  return `${supabaseUrl}/rest/v1/rpc/${name}`;
}

function rpcHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
  };
}

function toLocalReport(row: GetReportsRow): LocalReport {
  const parsedType = reportTypeSchema.safeParse(row.type);
  const type = parsedType.success ? parsedType.data : 'other';

  return {
    id: row.id,
    source: 'local',
    type,
    severity: severityByType[type],
    description: REPORT_LABELS[type],
    location: { latitude: row.latitude, longitude: row.longitude },
    distanceFromRouteMeters: 0,
    startTime: row.created_at,
    expectedClearTime: null,
    note: row.note,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    stillThereCount: row.still_there_count,
    clearedCount: row.cleared_count,
    confirmedByDevice: row.has_voted || row.is_mine ? ['this-device'] : [],
  };
}

export async function fetchReports(
  bounds: BoundingBox,
  signal?: AbortSignal,
): Promise<LocalReport[]> {
  assertConfigured();
  const rows = await apiClient.request<unknown>(rpcUrl('get_reports'), {
    method: 'POST',
    headers: rpcHeaders(),
    body: JSON.stringify({
      p_min_lat: bounds.south,
      p_max_lat: bounds.north,
      p_min_lon: bounds.west,
      p_max_lon: bounds.east,
      p_device_id: getDeviceId(),
    }),
    signal,
    retryable: true,
  });

  if (!Array.isArray(rows)) {
    throw new ApiClientError('The shared reports service returned an unexpected response.', 'invalid-response');
  }

  return rows.flatMap((row) => {
    const result = reportRowSchema.safeParse(row);
    return result.success ? [toLocalReport(result.data)] : [];
  });
}

export async function submitSharedReport(
  input: SubmitSharedReportInput,
): Promise<{ ok: boolean; reason?: 'rate-limit' }> {
  assertConfigured();

  try {
    await apiClient.request<unknown>(rpcUrl('submit_report'), {
      method: 'POST',
      headers: rpcHeaders(),
      body: JSON.stringify({
        p_type: input.type,
        p_note: input.note.trim().slice(0, 120),
        p_lat: input.location.latitude,
        p_lon: input.location.longitude,
        p_device_id: getDeviceId(),
      }),
      maxRetries: 0,
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.kind === 'bad-request') {
      return { ok: false, reason: 'rate-limit' };
    }
    throw error;
  }

  return { ok: true };
}

export async function voteOnReport(
  id: string,
  vote: 'still_there' | 'cleared',
): Promise<void> {
  assertConfigured();
  try {
    await apiClient.request<void>(rpcUrl('vote_report'), {
      method: 'POST',
      headers: rpcHeaders(),
      body: JSON.stringify({
        p_report_id: id,
        p_device_id: getDeviceId(),
        p_vote: vote,
      }),
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.kind === 'invalid-response') {
      return;
    }
    throw error;
  }
}