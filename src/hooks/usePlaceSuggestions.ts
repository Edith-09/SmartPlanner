import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { placesService } from '@/services/places/placesService';
import type { Coordinate } from '@/types/domain';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function usePlaceSuggestions(text: string, near: Coordinate | null) {
  const trimmedText = text.trim();
  const debouncedText = useDebouncedValue(trimmedText, 350);
  const roundedLatitude = near ? Math.round(near.latitude * 10) / 10 : null;
  const roundedLongitude = near ? Math.round(near.longitude * 10) / 10 : null;

  const query = useQuery({
    queryKey: ['place-suggestions', debouncedText, roundedLatitude, roundedLongitude],
    queryFn: ({ signal }) => placesService.autocomplete(debouncedText, { near, signal }),
    enabled: debouncedText.length >= 3,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  return { ...query, debouncedText };
}