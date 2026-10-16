import type { BoundingBox, Coordinate } from '@/types/domain';

export type { BoundingBox, Coordinate } from '@/types/domain';

const EARTH_RADIUS_METERS = 6_371_000;
const POLYLINE_PRECISION = 1e5;

export function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      if (index >= encoded.length) {
        throw new Error('Invalid encoded polyline');
      }
      byte = encoded.charCodeAt(index) - 63;
      if (byte < 0 || byte > 0x3f) {
        throw new Error('Invalid encoded polyline');
      }
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      if (index >= encoded.length) {
        throw new Error('Invalid encoded polyline');
      }
      byte = encoded.charCodeAt(index) - 63;
      if (byte < 0 || byte > 0x3f) {
        throw new Error('Invalid encoded polyline');
      }
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push({
      latitude: latitude / POLYLINE_PRECISION,
      longitude: longitude / POLYLINE_PRECISION,
    });
  }

  return coordinates;
}

export function haversineDistanceMeters(
  first: Coordinate,
  second: Coordinate,
): number {
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function pointToPolylineDistanceMeters(
  point: Coordinate,
  polyline: Coordinate[],
): number {
  if (polyline.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  if (polyline.length === 1) {
    return haversineDistanceMeters(point, polyline[0]);
  }

  const referenceLatitude = toRadians(point.latitude);
  const project = (coordinate: Coordinate): Coordinate => ({
    latitude: EARTH_RADIUS_METERS * toRadians(coordinate.latitude - point.latitude),
    longitude:
      EARTH_RADIUS_METERS *
      Math.cos(referenceLatitude) *
      toRadians(coordinate.longitude - point.longitude),
  });

  let minimumDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < polyline.length; index += 1) {
    const start = project(polyline[index - 1]);
    const end = project(polyline[index]);
    const segmentLatitude = end.latitude - start.latitude;
    const segmentLongitude = end.longitude - start.longitude;
    const segmentLengthSquared = segmentLatitude ** 2 + segmentLongitude ** 2;
    const projection =
      segmentLengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              -(start.latitude * segmentLatitude + start.longitude * segmentLongitude) /
                segmentLengthSquared,
            ),
          );
    const nearestLatitude = start.latitude + projection * segmentLatitude;
    const nearestLongitude = start.longitude + projection * segmentLongitude;
    minimumDistance = Math.min(
      minimumDistance,
      Math.hypot(nearestLatitude, nearestLongitude),
    );
  }

  return minimumDistance;
}

export function boundingBoxFromPolyline(
  polyline: Coordinate[],
  paddingMeters = 0,
): BoundingBox | null {
  if (polyline.length === 0) {
    return null;
  }

  const latitudes = polyline.map(({ latitude }) => latitude);
  const longitudes = polyline.map(({ longitude }) => longitude);
  const latitudePadding = toDegrees(paddingMeters / EARTH_RADIUS_METERS);
  const middleLatitude = toRadians((Math.min(...latitudes) + Math.max(...latitudes)) / 2);
  const longitudePadding =
    Math.abs(Math.cos(middleLatitude)) < 1e-6
      ? 180
      : Math.min(180, latitudePadding / Math.abs(Math.cos(middleLatitude)));

  return {
    south: Math.max(-90, Math.min(...latitudes) - latitudePadding),
    west: Math.max(-180, Math.min(...longitudes) - longitudePadding),
    north: Math.min(90, Math.max(...latitudes) + latitudePadding),
    east: Math.min(180, Math.max(...longitudes) + longitudePadding),
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}