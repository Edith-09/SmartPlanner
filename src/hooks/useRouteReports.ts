import { useMemo } from 'react';

import { useReports } from '@/hooks/useReports';
import type { LocalReport, Route } from '@/types/domain';
import { boundingBoxFromPolyline, pointToPolylineDistanceMeters } from '@/utils/geo';

export function useRouteReports(route: Route | null) {
  const bounds = useMemo(
    () => route && route.polyline.length > 0
      ? boundingBoxFromPolyline(route.polyline, 500)
      : null,
    [route],
  );
  const sharedReports = useReports(bounds);
  const reports = useMemo(() => {
    if (!route || route.polyline.length === 0) {
      return [];
    }

    return sharedReports.reports
      .flatMap((report): LocalReport[] => {
        const distanceFromRouteMeters = pointToPolylineDistanceMeters(
          report.location,
          route.polyline,
        );
        return distanceFromRouteMeters <= 150
          ? [{ ...report, distanceFromRouteMeters }]
          : [];
      })
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  }, [route, sharedReports.reports]);

  return {
    reports,
    isLoading: sharedReports.isLoading,
    isError: sharedReports.isError,
    refetch: sharedReports.refetch,
    confirmStillThere: sharedReports.confirmStillThere,
    markCleared: sharedReports.markCleared,
  };
}