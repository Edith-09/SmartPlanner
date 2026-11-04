import { apiConfiguration } from '@/config/environment';
import { apiClient } from '@/services/api/apiClient';
import type { Coordinate } from '@/types/domain';

export interface PlaceSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  location: Coordinate;
}

interface AutocompleteOptions {
  near?: Coordinate | null;
  signal?: AbortSignal;
}

interface TomTomSearchResult {
  id?: string;
  poi?: { name?: string };
  address?: {
    freeformAddress?: string;
    countrySubdivision?: string;
    country?: string;
  };
  position?: { lat?: number; lon?: number };
}

interface TomTomSearchResponse {
  results?: TomTomSearchResult[];
}

const SEARCH_BASE_URL = 'https://api.tomtom.com/search/2';

export const placesService = {
  async autocomplete(
    input: string,
    { near, signal }: AutocompleteOptions = {},
  ): Promise<PlaceSuggestion[]> {
    const query = [
      `key=${encodeURIComponent(apiConfiguration.tomTomApiKey)}`,
      'typeahead=true',
      'limit=6',
    ];
    if (near) {
      query.push(`lat=${encodeURIComponent(String(near.latitude))}`);
      query.push(`lon=${encodeURIComponent(String(near.longitude))}`);
    }

    const response = await apiClient.request<TomTomSearchResponse>(
      `${SEARCH_BASE_URL}/search/${encodeURIComponent(input)}.json?${query.join('&')}`,
      { signal },
    );

    if (!Array.isArray(response.results)) {
      return [];
    }

    return response.results.flatMap((result) => {
      const { id, poi, address, position } = result;
      const primaryText = poi?.name ?? address?.freeformAddress;
      if (
        !id ||
        typeof position?.lat !== 'number' ||
        typeof position.lon !== 'number' ||
        !primaryText?.trim()
      ) {
        return [];
      }

      const secondaryText = poi?.name
        ? address?.freeformAddress ?? ''
        : [address?.countrySubdivision, address?.country].filter(Boolean).join(', ');
      return [{
        placeId: id,
        primaryText,
        secondaryText,
        location: { latitude: position.lat, longitude: position.lon },
      }];
    });
  },
};