import * as Location from 'expo-location';
import { Linking } from 'react-native';

import type { Coordinate } from '@/types/domain';

export type LocationPermissionState = 'granted' | 'denied' | 'blocked';

export interface LocationPermissionResult {
  state: LocationPermissionState;
  canAskAgain: boolean;
}

export class LocationServiceError extends Error {
  readonly kind: 'permission-denied' | 'timeout' | 'unavailable';

  constructor(kind: LocationServiceError['kind'], message: string) {
    super(message);
    this.name = 'LocationServiceError';
    this.kind = kind;
  }
}

const DEFAULT_LOCATION_TIMEOUT_MS = 12_000;

function normalizePermission(
  response: Location.LocationPermissionResponse,
): LocationPermissionResult {
  if (response.granted) {
    return { state: 'granted', canAskAgain: response.canAskAgain };
  }
  return {
    state: response.canAskAgain ? 'denied' : 'blocked',
    canAskAgain: response.canAskAgain,
  };
}

export const locationService = {
  async checkPermission(): Promise<LocationPermissionResult> {
    return normalizePermission(await Location.getForegroundPermissionsAsync());
  },

  async requestPermission(): Promise<LocationPermissionResult> {
    return normalizePermission(await Location.requestForegroundPermissionsAsync());
  },

  openSettings(): Promise<void> {
    return Linking.openSettings();
  },

  async getCurrentPosition(timeoutMs = DEFAULT_LOCATION_TIMEOUT_MS): Promise<Coordinate> {
    const permission = await this.checkPermission();
    if (permission.state !== 'granted') {
      throw new LocationServiceError(
        'permission-denied',
        permission.state === 'blocked'
          ? 'Location access is blocked. Enable it in device settings.'
          : 'Location access is required to get your current position.',
      );
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new LocationServiceError(
                  'timeout',
                  'Could not determine your location in time. Please try again.',
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      if (error instanceof LocationServiceError) {
        throw error;
      }
      throw new LocationServiceError(
        'unavailable',
        'Your location is unavailable. Check device location services and try again.',
      );
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  },

  async reverseGeocodeLabel(coordinate: Coordinate): Promise<string> {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        return 'My location';
      }
      const [address] = await Location.reverseGeocodeAsync(coordinate);
      if (!address) {
        return 'My location';
      }
      return (
        address.formattedAddress ||
        [address.name, address.street, address.streetNumber, address.city, address.region]
          .filter(Boolean)
          .join(', ') ||
        'My location'
      );
    } catch {
      return 'My location';
    }
  },
};