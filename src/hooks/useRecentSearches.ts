import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getRecents, saveRecents } from '@/services/recents/recentsStorage';
import type { PlaceSuggestion } from '@/services/places/placesService';

const recentsQueryKey = ['recents'] as const;

export function useRecentSearches() {
  const queryClient = useQueryClient();
  const recentsQuery = useQuery({
    queryKey: recentsQueryKey,
    queryFn: getRecents,
  });
  const recents = recentsQuery.data ?? [];

  const currentRecents = (): PlaceSuggestion[] =>
    queryClient.getQueryData<PlaceSuggestion[]>(recentsQueryKey) ?? recents;

  const addRecent = (place: PlaceSuggestion): void => {
    const updatedRecents = [
      place,
      ...currentRecents().filter((recent) => recent.placeId !== place.placeId),
    ].slice(0, 5);
    saveRecents(updatedRecents);
    queryClient.setQueryData(recentsQueryKey, updatedRecents);
  };

  const clearRecents = (): void => {
    saveRecents([]);
    queryClient.setQueryData(recentsQueryKey, []);
  };

  return { recents, addRecent, clearRecents };
}