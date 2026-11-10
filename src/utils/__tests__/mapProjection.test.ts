import type { Coordinate } from '@/types/domain';

import {
  centerOf,
  downsample,
  fitZoom,
  project,
  tileUrl,
  tilesForView,
  viewOrigin,
  worldPixel,
} from '../mapProjection';

describe('map projection utilities', () => {
  it('projects the world origin and the western edge', () => {
    expect(worldPixel({ latitude: 0, longitude: 0 }, 0)).toEqual({ x: 128, y: 128 });
    expect(worldPixel({ latitude: 0, longitude: -180 }, 0).x).toBe(0);
  });

  it('centers coordinates and fits a larger area at an equal or smaller zoom', () => {
    const smallArea: Coordinate[] = [
      { latitude: 10, longitude: 10 },
      { latitude: 10.1, longitude: 10.1 },
    ];
    const largeArea: Coordinate[] = [
      { latitude: 5, longitude: 5 },
      { latitude: 15, longitude: 15 },
    ];

    expect(centerOf(smallArea)).toEqual({ latitude: 10.05, longitude: 10.05 });
    expect(fitZoom(largeArea, 360, 260)).toBeLessThanOrEqual(fitZoom(smallArea, 360, 260));
    expect(fitZoom([{ latitude: 10, longitude: 10 }], 360, 260)).toBe(15);
  });

  it('projects a centered coordinate into the middle of the view', () => {
    const center = { latitude: 20, longitude: 30 };
    const origin = viewOrigin(center, 8, 320, 240);

    expect(project(center, 8, origin)).toEqual({ x: 160, y: 120 });
  });

  it('includes the tile containing the view center and wraps columns', () => {
    const tiles = tilesForView({ x: 128, y: 128 }, 256, 256, 2);
    expect(tiles).toContainEqual({ x: 1, y: 1, left: 128, top: 128 });

    const wrapped = tilesForView({ x: -128, y: 128 }, 256, 256, 2);
    expect(wrapped.some(({ x }) => x === 3)).toBe(true);
  });

  it('builds a TomTom raster tile URL', () => {
    expect(tileUrl(1, 2, 3, 'test-key')).toBe(
      'https://d.api.tomtom.com/map/1/tile/basic/main/3/1/2.png?key=test-key',
    );
  });

  it('downsamples evenly while preserving endpoints and original indices', () => {
    const result = downsample(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 4);

    expect(result).toEqual({ items: ['a', 'd', 'g', 'j'], indices: [0, 3, 6, 9] });
    expect(downsample(['a', 'b'], 4)).toEqual({ items: ['a', 'b'], indices: [0, 1] });
  });
});