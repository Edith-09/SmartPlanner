import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getFavorites, saveFavorites } from '@/services/favorites/favoritesStorage';
import type { FavoriteRoute, Route } from '@/types/domain';

const favoritesQueryKey = ['favorites'] as const;

export function useFavorites() {
  const queryClient = useQueryClient();
  const favoritesQuery = useQuery({
    queryKey: favoritesQueryKey,
    queryFn: getFavorites,
  });
  const favorites = favoritesQuery.data ?? [];

  const writeFavorites = useMutation({
    mutationFn: async (updatedFavorites: FavoriteRoute[]) => {
      saveFavorites(updatedFavorites);
      return updatedFavorites;
    },
    onSuccess: (updatedFavorites) => {
      queryClient.setQueryData(favoritesQueryKey, updatedFavorites);
    },
  });

  const currentFavorites = (): FavoriteRoute[] =>
    queryClient.getQueryData<FavoriteRoute[]>(favoritesQueryKey) ?? favorites;

  const isSaved = (placeId: string): boolean =>
    favorites.some((favorite) => favorite.to.placeId === placeId);

  const addFavorite = (route: Route): void => {
    const leg = route.legs[0];
    if (!leg) {
      return;
    }
    const existingFavorites = currentFavorites();
    if (existingFavorites.some((favorite) => favorite.to.placeId === leg.to.placeId)) {
      return;
    }

    const favorite: FavoriteRoute = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      label: leg.to.displayName,
      from: leg.from,
      to: leg.to,
      createdAt: new Date().toISOString(),
      useCount: 0,
    };
    writeFavorites.mutate([...existingFavorites, favorite]);
  };

  const removeFavorite = (id: string): void => {
    writeFavorites.mutate(currentFavorites().filter((favorite) => favorite.id !== id));
  };

  const markUsed = (id: string): void => {
    writeFavorites.mutate(
      currentFavorites().map((favorite) =>
        favorite.id === id ? { ...favorite, useCount: favorite.useCount + 1 } : favorite,
      ),
    );
  };

  return { favorites, isSaved, addFavorite, removeFavorite, markUsed };
}