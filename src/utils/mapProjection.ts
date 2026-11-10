import type { Coordinate } from '@/types/domain';

export const TILE_SIZE = 256;

const MAX_MERCATOR_LATITUDE = 85.05112878;

export interface PixelPosition {
  x: number;
  y: number;
}

export interface MapTile extends PixelPosition {
  x: number;
  y: number;
  left: number;
  top: number;
}

export function worldPixel(coord: Coordinate, zoom: number): PixelPosition {
  const scale = TILE_SIZE * 2 ** zoom;
  const latitude = Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, coord.latitude),
  );
  const sine = Math.sin((latitude * Math.PI) / 180);

  return {
    x: ((coord.longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
  };
}

export function centerOf(coords: Coordinate[]): Coordinate {
  if (coords.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const latitudes = coords.map(({ latitude }) => latitude);
  const longitudes = coords.map(({ longitude }) => longitude);

  return {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  };
}

export function fitZoom(
  coords: Coordinate[],
  width: number,
  height: number,
  padding = 32,
): number {
  if (coords.length === 0) {
    return 15;
  }

  const projected = coords.map((coord) => worldPixel(coord, 0));
  const horizontalExtent =
    Math.max(...projected.map(({ x }) => x)) - Math.min(...projected.map(({ x }) => x));
  const verticalExtent =
    Math.max(...projected.map(({ y }) => y)) - Math.min(...projected.map(({ y }) => y));

  if (horizontalExtent === 0 && verticalExtent === 0) {
    return 15;
  }

  for (let zoom = 18; zoom >= 3; zoom -= 1) {
    const scale = 2 ** zoom;
    if (
      horizontalExtent * scale <= width - 2 * padding &&
      verticalExtent * scale <= height - 2 * padding
    ) {
      return zoom;
    }
  }

  return 3;
}

export function viewOrigin(
  center: Coordinate,
  zoom: number,
  width: number,
  height: number,
): PixelPosition {
  const centerPixel = worldPixel(center, zoom);

  return {
    x: centerPixel.x - width / 2,
    y: centerPixel.y - height / 2,
  };
}

export function project(
  coord: Coordinate,
  zoom: number,
  origin: PixelPosition,
): PixelPosition {
  const position = worldPixel(coord, zoom);

  return {
    x: position.x - origin.x,
    y: position.y - origin.y,
  };
}

export function tilesForView(
  origin: PixelPosition,
  width: number,
  height: number,
  zoom: number,
): MapTile[] {
  if (width <= 0 || height <= 0) {
    return [];
  }

  const tileCount = 2 ** zoom;
  const firstColumn = Math.floor(origin.x / TILE_SIZE);
  const lastColumn = Math.ceil((origin.x + width) / TILE_SIZE) - 1;
  const firstRow = Math.floor(origin.y / TILE_SIZE);
  const lastRow = Math.ceil((origin.y + height) / TILE_SIZE) - 1;
  const tiles: MapTile[] = [];

  for (let unwrappedX = firstColumn; unwrappedX <= lastColumn; unwrappedX += 1) {
    for (let y = firstRow; y <= lastRow; y += 1) {
      if (y < 0 || y >= tileCount) {
        continue;
      }

      const x = ((unwrappedX % tileCount) + tileCount) % tileCount;
      tiles.push({
        x,
        y,
        left: unwrappedX * TILE_SIZE - origin.x,
        top: y * TILE_SIZE - origin.y,
      });
    }
  }

  return tiles;
}

export function tileUrl(
  x: number,
  y: number,
  zoom: number,
  apiKey: string,
  style: 'main' | 'night' = 'main',
): string {
  const subdomain = 'abcd'[(x + y) % 4];
  return `https://${subdomain}.api.tomtom.com/map/1/tile/basic/${style}/${zoom}/${x}/${y}.png?key=${apiKey}`;
}

export function downsample<T>(
  items: T[],
  maxPoints: number,
): { items: T[]; indices: number[] } {
  if (items.length <= maxPoints) {
    return { items, indices: items.map((_, index) => index) };
  }
  if (items.length === 0) {
    return { items: [], indices: [] };
  }
  if (maxPoints <= 1) {
    return {
      items: [items[0], items[items.length - 1]],
      indices: [0, items.length - 1],
    };
  }

  const count = Math.floor(maxPoints);
  const indices = Array.from({ length: count }, (_, index) =>
    Math.round((index * (items.length - 1)) / (count - 1)),
  );

  return {
    items: indices.map((index) => items[index]),
    indices,
  };
}