import { memo, useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { IconButton } from '@/components/ui';
import { apiConfiguration } from '@/config/environment';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Coordinate, Route } from '@/types/domain';
import {
  centerOf,
  downsample,
  fitZoom,
  project,
  tileUrl,
  tilesForView,
  viewOrigin,
  type PixelPosition,
} from '@/utils/mapProjection';

const MAP_TRAFFIC_COLORS = {
  light: '#22A55B',
  moderate: '#F59E0B',
  heavy: '#DC2626',
  unknown: '#8A948E',
} as const;

interface RouteMapProps {
  selectedRoute: Route;
  alternatives: Route[];
  origin: Coordinate;
  height?: number;
}

interface LineSegmentProps {
  start: PixelPosition;
  end: PixelPosition;
  thickness: number;
  color: string;
  opacity?: number;
}

function isFarOutsideView(
  start: PixelPosition,
  end: PixelPosition,
  width: number,
  height: number,
): boolean {
  return (
    (start.x < -1_000 && end.x < -1_000) ||
    (start.x > width + 1_000 && end.x > width + 1_000) ||
    (start.y < -1_000 && end.y < -1_000) ||
    (start.y > height + 1_000 && end.y > height + 1_000)
  );
}

const LineSegment = memo(function LineSegment({
  start,
  end,
  thickness,
  color,
  opacity = 1,
}: LineSegmentProps) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);
  if (length === 0) {
    return null;
  }

  const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
  const middleX = (start.x + end.x) / 2;
  const middleY = (start.y + end.y) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        backgroundColor: color,
        borderRadius: thickness / 2,
        height: thickness,
        left: middleX - length / 2,
        opacity,
        position: 'absolute',
        top: middleY - thickness / 2,
        transform: [{ rotate: `${angle}deg` }],
        width: length,
      }}
    />
  );
});

export function RouteMap({
  selectedRoute,
  alternatives,
  origin,
  height = 260,
}: RouteMapProps) {
  const { colors, colorScheme } = useAppTheme();
  const [width, setWidth] = useState(0);
  const [zoomState, setZoomState] = useState<{ key: string; offset: number }>({
    key: '',
    offset: 0,
  });
  const destinationPlace = selectedRoute.legs[0]?.to;
  const destination = destinationPlace?.location ?? origin;
  const destinationPlaceId = destinationPlace?.placeId ?? '';
  const zoomKey = `${destinationPlaceId}|${selectedRoute.name}`;
  const zoomOffset = zoomState.key === zoomKey ? zoomState.offset : 0;
  const fitPoints = useMemo(
    () => [...selectedRoute.polyline, origin, destination],
    [destination, origin, selectedRoute.polyline],
  );
  const routeCenter = centerOf(fitPoints);
  const centerLatitude = routeCenter.latitude;
  const centerLongitude = routeCenter.longitude;
  const zoom = Math.max(3, Math.min(18, fitZoom(fitPoints, width, height) + zoomOffset));
  const mapOrigin = useMemo(
    () => viewOrigin({ latitude: centerLatitude, longitude: centerLongitude }, zoom, width, height),
    [centerLatitude, centerLongitude, height, width, zoom],
  );
  const visibleTiles = tilesForView(mapOrigin, width, height, zoom);
  const tileStyle = colorScheme === 'dark' ? 'night' : 'main';
  const originX = mapOrigin.x;
  const originY = mapOrigin.y;
  const selectedSamples = useMemo(
    () => downsample(selectedRoute.polyline, 250),
    [selectedRoute.polyline],
  );
  const selectedProjectedPoints = useMemo(
    () =>
      selectedSamples.items.map((coordinate) =>
        project(coordinate, zoom, { x: originX, y: originY }),
      ),
    [originX, originY, selectedSamples.items, zoom],
  );
  const alternativeProjectedRoutes = useMemo(
    () => alternatives.map((route) => ({
      routeId: route.routeId,
      points: downsample(route.polyline, 120).items.map((coordinate) =>
        project(coordinate, zoom, { x: originX, y: originY }),
      ),
    })),
    [alternatives, originX, originY, zoom],
  );
  const selectedLineSegments = useMemo(() => {
    const segments = [];

    for (let index = 1; index < selectedProjectedPoints.length; index += 1) {
      const start = selectedProjectedPoints[index - 1];
      const end = selectedProjectedPoints[index];
      const originalIndex = selectedSamples.indices[index - 1];
      if (
        !start ||
        !end ||
        originalIndex === undefined ||
        isFarOutsideView(start, end, width, height)
      ) {
        continue;
      }

      const trafficSegment = selectedRoute.trafficSegments.find(
        (segment) => originalIndex >= segment.startIndex && originalIndex <= segment.endIndex,
      );
      const color =
        trafficSegment?.congestion === 'moderate'
          ? MAP_TRAFFIC_COLORS.moderate
          : trafficSegment?.congestion === 'heavy'
            ? MAP_TRAFFIC_COLORS.heavy
            : trafficSegment?.congestion === 'unknown'
              ? MAP_TRAFFIC_COLORS.unknown
              : MAP_TRAFFIC_COLORS.light;

      segments.push({ start, end, originalIndex, color });
    }

    return segments;
  }, [
    height,
    selectedProjectedPoints,
    selectedRoute.trafficSegments,
    selectedSamples.indices,
    width,
  ]);

  const onLayout = (event: LayoutChangeEvent): void => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <>
      <View
        accessibilityLabel={`Map of the route ${selectedRoute.name ?? ''}`}
        onLayout={onLayout}
        style={[
          styles.map,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: theme.radius.lg,
            height,
          },
        ]}
      >
        {width > 0 ? (
          <>
            {apiConfiguration.tomTomApiKey
              ? visibleTiles.map((tile) => (
                  <Image
                    key={`${tile.x}:${tile.y}:${tile.left}:${tileStyle}`}
                    source={{
                      uri: tileUrl(tile.x, tile.y, zoom, apiConfiguration.tomTomApiKey, tileStyle),
                    }}
                    style={[styles.tile, { left: tile.left, top: tile.top }]}
                  />
                ))
              : null}

            {alternativeProjectedRoutes.map((route, routeIndex) =>
              route.points.slice(1).map((end, pointIndex) => {
                const start = route.points[pointIndex];
                if (!start || isFarOutsideView(start, end, width, height)) {
                  return null;
                }

                return (
                  <LineSegment
                    key={`${route.routeId}:${routeIndex}:${pointIndex}`}
                    start={start}
                    end={end}
                    thickness={4}
                    color={colors.mutedText}
                    opacity={0.8}
                  />
                );
              }),
            )}

            {selectedLineSegments.map((segment) => (
              <LineSegment
                key={`outline:${segment.originalIndex}`}
                start={segment.start}
                end={segment.end}
                thickness={10}
                color={colors.surface}
              />
            ))}
            {selectedLineSegments.map((segment) => (
              <LineSegment
                key={`route:${segment.originalIndex}`}
                start={segment.start}
                end={segment.end}
                thickness={6}
                color={segment.color}
              />
            ))}

            {(() => {
              const originPosition = project(origin, zoom, mapOrigin);
              const destinationPosition = project(destination, zoom, mapOrigin);

              return (
                <>
                  <View
                    pointerEvents="none"
                    style={[
                      styles.marker,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.surface,
                        height: 18,
                        left: originPosition.x - 9,
                        top: originPosition.y - 9,
                        width: 18,
                      },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      styles.marker,
                      {
                        backgroundColor: colors.danger,
                        borderColor: colors.surface,
                        height: 22,
                        left: destinationPosition.x - 11,
                        top: destinationPosition.y - 11,
                        width: 22,
                      },
                    ]}
                  />
                </>
              );
            })()}

            <View pointerEvents="box-none" style={styles.zoomControls}>
              <IconButton
                accessibilityLabel="Zoom in"
                disabled={zoom >= 18}
                icon="+"
                onPress={() => setZoomState({ key: zoomKey, offset: zoomOffset + 1 })}
              />
              <IconButton
                accessibilityLabel="Zoom out"
                disabled={zoom <= 3}
                icon="−"
                onPress={() => setZoomState({ key: zoomKey, offset: zoomOffset - 1 })}
              />
              <IconButton
                accessibilityLabel="Fit route"
                icon="Fit"
                onPress={() => setZoomState({ key: zoomKey, offset: 0 })}
              />
            </View>

            <Text
              pointerEvents="none"
              style={[
                styles.attribution,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  fontSize: theme.typography.caption,
                },
              ]}
            >
              © TomTom
            </Text>
          </>
        ) : null}
      </View>

      <View accessibilityLabel="Map legend" style={styles.legend}>
        <LegendItem label="Clear" color={MAP_TRAFFIC_COLORS.light} />
        <LegendItem label="Moderate" color={MAP_TRAFFIC_COLORS.moderate} />
        <LegendItem label="Heavy" color={MAP_TRAFFIC_COLORS.heavy} />
        {alternatives.length > 0 ? (
          <LegendItem label="Other routes" color={colors.mutedText} />
        ) : null}
      </View>
    </>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  const { colors } = useAppTheme();

  return (
    <View accessibilityLabel={label} style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.secondaryText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    width: '100%',
  },
  tile: {
    height: 256,
    position: 'absolute',
    width: 256,
  },
  marker: {
    borderRadius: theme.radius.pill,
    borderWidth: 3,
    position: 'absolute',
  },
  zoomControls: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
  },
  attribution: {
    borderRadius: theme.radius.sm,
    bottom: theme.spacing.sm,
    opacity: 0.88,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    position: 'absolute',
    right: theme.spacing.sm,
  },
  legend: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  legendDot: {
    borderRadius: theme.radius.pill,
    height: theme.spacing.sm,
    width: theme.spacing.sm,
  },
  legendLabel: {
    fontSize: theme.typography.caption,
  },
});