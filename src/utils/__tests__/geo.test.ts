import {
  boundingBoxFromPolyline,
  decodePolyline,
  haversineDistanceMeters,
  pointToPolylineDistanceMeters,
} from '../geo';
import { formatDistance, formatDuration, formatRelativeTime } from '../format';

describe('geospatial and formatting utilities', () => {
  it('decodes an encoded polyline', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });

  it('rejects a truncated encoded polyline', () => {
    expect(() => decodePolyline('_')).toThrow('Invalid encoded polyline');
  });

  it('calculates great-circle distance', () => {
    expect(
      haversineDistanceMeters(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ),
    ).toBeCloseTo(111_195, -1);
  });

  it('measures distance to the nearest point on a polyline', () => {
    expect(
      pointToPolylineDistanceMeters(
        { latitude: 0.001, longitude: 0.005 },
        [
          { latitude: 0, longitude: 0 },
          { latitude: 0, longitude: 0.01 },
        ],
      ),
    ).toBeCloseTo(111.2, 0);
  });

  it('returns a padded bounding box and handles empty paths', () => {
    expect(
      boundingBoxFromPolyline(
        [
          { latitude: 0, longitude: 0 },
          { latitude: 0, longitude: 1 },
        ],
        1_000,
      ),
    ).toMatchObject({ south: expect.any(Number), west: expect.any(Number) });
    expect(boundingBoxFromPolyline([])).toBeNull();
    expect(boundingBoxFromPolyline([{ latitude: 0, longitude: 0 }], 1_000)?.south).toBeLessThan(0);
  });

  it('formats durations and distances for display', () => {
    expect(formatDuration(3_600)).toBe('1 hr');
    expect(formatDuration(3_661)).toBe('1 hr 2 min');
    expect(formatDistance(850)).toBe('850 m');
    expect(formatDistance(1_250)).toBe('1.3 km');
  });

  it('formats relative times in both directions', () => {
    const now = Date.parse('2026-10-16T12:00:00.000Z');
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5 mins ago');
    expect(formatRelativeTime(now + 2 * 60 * 60_000, now)).toBe('in 2 hrs');
    expect(formatRelativeTime('not a date', now)).toBe('');
  });
});