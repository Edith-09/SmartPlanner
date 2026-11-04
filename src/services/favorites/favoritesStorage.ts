import { z } from 'zod';

import { storage, storageKeys } from '@/services/storage/storage';
import type { FavoriteRoute } from '@/types/domain';

const coordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const placeSchema = z.object({
  placeId: z.string(),
  displayName: z.string(),
  formattedAddress: z.string(),
  location: coordinateSchema,
});

const favoriteRouteSchema = z.object({
  id: z.string(),
  label: z.string(),
  from: placeSchema,
  to: placeSchema,
  createdAt: z.string(),
  useCount: z.number(),
}) satisfies z.ZodType<FavoriteRoute>;

const favoritesSchema = z.array(favoriteRouteSchema);
const FAVORITES_SCHEMA_VERSION = 1;

export function getFavorites(): FavoriteRoute[] {
  return storage.getJson(
    storageKeys.favorites,
    favoritesSchema,
    [],
    FAVORITES_SCHEMA_VERSION,
  );
}

export function saveFavorites(favorites: FavoriteRoute[]): void {
  storage.setJson(storageKeys.favorites, favorites, FAVORITES_SCHEMA_VERSION);
}