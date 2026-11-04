import { useQuery } from '@tanstack/react-query';

import { routesService, type RouteOrigin } from '@/services/routes/routesService';
import type { PlaceSuggestion } from '@/services/places/placesService';

export function useRouteStatus(
  origin: RouteOrigin | null,
  destination: PlaceSuggestion | null,
) {
  const roundedLatitude = origin ? Math.round(origin.coordinate.latitude * 1_000) / 1_000 : null;
  const roundedLongitude = origin ? Math.round(origin.coordinate.longitude * 1_000) / 1_000 : null;

  return useQuery({
    queryKey: [
      'route-status',
      destination?.placeId ?? null,
      roundedLatitude,
      roundedLongitude,
    ],
    queryFn: ({ signal }) => {
      if (!origin || !destination) {
        throw new Error('An origin and destination are required to find a route.');
      }
      return routesService.getRouteStatus({ origin, destination, signal });
    },
    enabled: Boolean(origin && destination),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
}