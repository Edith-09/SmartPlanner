import { z } from 'zod';

import { storage, storageKeys } from '@/services/storage/storage';
import type { PlaceSuggestion } from '@/services/places/placesService';

const coordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const placeSuggestionSchema = z.object({
  placeId: z.string(),
  primaryText: z.string(),
  secondaryText: z.string(),
  location: coordinateSchema,
}) satisfies z.ZodType<PlaceSuggestion>;

const recentsSchema = z.array(placeSuggestionSchema);
const RECENTS_SCHEMA_VERSION = 1;

export function getRecents(): PlaceSuggestion[] {
  return storage.getJson(storageKeys.recents, recentsSchema, [], RECENTS_SCHEMA_VERSION);
}

export function saveRecents(list: PlaceSuggestion[]): void {
  storage.setJson(storageKeys.recents, list, RECENTS_SCHEMA_VERSION);
}