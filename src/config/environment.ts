const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

export const apiConfiguration = {
  googleRoutesBaseUrl: trimTrailingSlashes(
    process.env.EXPO_PUBLIC_GOOGLE_ROUTES_BASE_URL ?? 'https://routes.googleapis.com/directions/v2',
  ),
  googlePlacesBaseUrl: trimTrailingSlashes(
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_BASE_URL ?? 'https://places.googleapis.com/v1',
  ),
  tomTomTrafficBaseUrl: trimTrailingSlashes(
    process.env.EXPO_PUBLIC_TOMTOM_TRAFFIC_BASE_URL ??
      'https://api.tomtom.com/traffic/services/5',
  ),
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  tomTomApiKey: process.env.EXPO_PUBLIC_TOMTOM_API_KEY ?? '',
} as const;
