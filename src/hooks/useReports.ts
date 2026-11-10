import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchReports,
  submitSharedReport,
  voteOnReport,
} from '@/services/reports/sharedReportsService';
import type { BoundingBox, Coordinate, IncidentType } from '@/types/domain';

interface SubmitReportInput {
  type: IncidentType;
  note: string;
  location: Coordinate;
}

export function useReports(bounds: BoundingBox | null) {
  const queryClient = useQueryClient();
  const roundedBounds = bounds
    ? {
        south: Math.round(bounds.south * 100) / 100,
        north: Math.round(bounds.north * 100) / 100,
        west: Math.round(bounds.west * 100) / 100,
        east: Math.round(bounds.east * 100) / 100,
      }
    : null;
  const reportsQuery = useQuery({
    queryKey: ['shared-reports', roundedBounds],
    queryFn: ({ signal }) => bounds ? fetchReports(bounds, signal) : Promise.resolve([]),
    enabled: bounds !== null,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
  });

  const invalidateSharedReports = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['shared-reports'] });
  };

  const submitReport = async (
    input: SubmitReportInput,
  ): Promise<{ ok: boolean; reason?: 'rate-limit' }> => {
    const result = await submitSharedReport(input);
    if (result.ok) {
      await invalidateSharedReports();
    }
    return result;
  };

  const confirmStillThere = async (id: string): Promise<void> => {
    await voteOnReport(id, 'still_there');
    await invalidateSharedReports();
  };

  const markCleared = async (id: string): Promise<void> => {
    await voteOnReport(id, 'cleared');
    await invalidateSharedReports();
  };

  return {
    reports: reportsQuery.data ?? [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    error: reportsQuery.error,
    refetch: reportsQuery.refetch,
    submitReport,
    confirmStillThere,
    markCleared,
  };
}