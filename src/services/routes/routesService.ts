import { apiConfiguration } from '@/config/environment';
import { ApiClientError, apiClient } from '@/services/api/apiClient';
import type { PlaceSuggestion } from '@/services/places/placesService';
import type {
  CongestionLevel,
  Coordinate,
  Incident,
  Place,
  Route,
  TrafficSegment,
} from '@/types/domain';

export interface RouteOrigin {
  coordinate: Coordinate;
  label: string;
}

interface RouteStatusOptions {
  origin: RouteOrigin;
  destination: PlaceSuggestion;
  signal?: AbortSignal;
}

interface TomTomRouteResponse {
  routes?: TomTomRouteEntry[];
}

interface TomTomRouteEntry {
  summary?: {
      lengthInMeters?: number;
      travelTimeInSeconds?: number;
      trafficDelayInSeconds?: number;
      noTrafficTravelTimeInSeconds?: number;
  };
  legs?: { points?: Coordinate[] }[];
  sections?: {
    sectionType?: string;
    simpleCategory?: string;
    startPointIndex?: number;
    endPointIndex?: number;
    delayInSeconds?: number;
    magnitudeOfDelay?: number | string;
  }[];
  guidance?: {
    instructions?: TomTomRouteInstruction[];
  };
  instructions?: TomTomRouteInstruction[];
}

interface TomTomRouteInstruction {
  routeOffsetInMeters?: number;
  street?: string;
  roadNumbers?: string[];
}

const ROUTING_BASE_URL = 'https://api.tomtom.com/routing/1';

function deriveRouteName(
  instructions: TomTomRouteInstruction[] | undefined,
  totalLengthMeters: number,
): string | undefined {
  if (!instructions) {
    return undefined;
  }

  const distancesByLabel = new Map<string, { label: string; distance: number }>();
  instructions.forEach((instruction, index) => {
    const startOffset = instruction.routeOffsetInMeters;
    if (typeof startOffset !== 'number') {
      return;
    }
    const nextOffset = instructions[index + 1]?.routeOffsetInMeters ?? totalLengthMeters;
    const distance = nextOffset - startOffset;
    if (distance <= 0) {
      return;
    }

    const street = instruction.street?.trim();
    const label = street || instruction.roadNumbers?.[0]?.trim();
    if (!label) {
      return;
    }

    const key = label.toLocaleLowerCase();
    const existing = distancesByLabel.get(key);
    if (existing) {
      existing.distance += distance;
    } else {
      distancesByLabel.set(key, { label, distance });
    }
  });

  const rankedLabels = [...distancesByLabel.values()].sort(
    (first, second) => second.distance - first.distance,
  );
  const primary = rankedLabels[0];
  if (!primary) {
    return undefined;
  }

  const secondary = rankedLabels[1];
  return secondary && secondary.distance >= totalLengthMeters * 0.2
    ? `via ${primary.label} and ${secondary.label}`
    : `via ${primary.label}`;
}

export function classifyCongestion(
  durationSeconds: number,
  staticDurationSeconds: number,
): CongestionLevel {
  if (staticDurationSeconds <= 0) {
    return 'unknown';
  }
  const delay = durationSeconds - staticDurationSeconds;
  if (delay < 120) {
    return 'light';
  }
  const ratio = delay / staticDurationSeconds;
  if (ratio < 0.15) {
    return 'light';
  }
  if (ratio < 0.4) {
    return 'moderate';
  }
  return 'heavy';
}

function buildRoute(
  tomTomRoute: TomTomRouteEntry,
  origin: RouteOrigin,
  destination: PlaceSuggestion,
  routeId: string,
  name: string,
): Route {
  const summary = tomTomRoute.summary;
  const durationSeconds = summary?.travelTimeInSeconds ?? 0;
  const staticDurationSeconds =
    summary?.noTrafficTravelTimeInSeconds ??
    (summary?.trafficDelayInSeconds !== undefined
      ? durationSeconds - summary.trafficDelayInSeconds
      : durationSeconds);
  const trafficDelaySeconds = Math.max(0, durationSeconds - staticDurationSeconds);
  const polyline = tomTomRoute.legs?.flatMap((leg) => leg.points ?? []) ?? [];
  const trafficSections = (tomTomRoute.sections ?? []).filter(
    (section) =>
      section.sectionType === 'TRAFFIC' &&
      typeof section.startPointIndex === 'number' &&
      typeof section.endPointIndex === 'number',
  );
  const trafficSegments: TrafficSegment[] = trafficSections.map((section) => {
    const magnitude = Number(section.magnitudeOfDelay);
    const congestion =
      magnitude === 1 || magnitude === 2
        ? 'moderate'
        : magnitude === 3 || magnitude === 4
          ? 'heavy'
          : 'unknown';
    return {
      startIndex: section.startPointIndex as number,
      endIndex: section.endPointIndex as number,
      congestion,
    };
  });
  const incidentsWithDelay = trafficSections.flatMap((section) => {
    const startIndex = section.startPointIndex;
    const endIndex = section.endPointIndex;
    const location = typeof startIndex === 'number' ? polyline[startIndex] : undefined;
    const category = section.simpleCategory;
    if (
      !location ||
      typeof startIndex !== 'number' ||
      typeof endIndex !== 'number' ||
      (category !== 'JAM' &&
        category !== 'ROAD_WORK' &&
        category !== 'ROAD_CLOSURE' &&
        category !== 'OTHER')
    ) {
      return [];
    }

    const magnitude = Number(section.magnitudeOfDelay);
    const severity =
      magnitude === 1
        ? 'low'
        : magnitude === 2
          ? 'moderate'
          : magnitude === 3 || magnitude === 4
            ? 'high'
            : 'unknown';
    const baseDescription =
      category === 'ROAD_WORK'
        ? 'Roadworks'
        : category === 'ROAD_CLOSURE'
          ? 'Road closed'
          : category === 'JAM'
            ? 'Traffic jam'
            : 'Traffic incident';
    const delayInSeconds = section.delayInSeconds ?? 0;
    const description =
      delayInSeconds >= 60
        ? `${baseDescription}, ${Math.round(delayInSeconds / 60)} min delay`
        : baseDescription;
    const incident: Incident = {
      id: `traffic-${startIndex}-${endIndex}`,
      source: 'tomtom',
      type:
        category === 'ROAD_WORK'
          ? 'roadwork'
          : category === 'ROAD_CLOSURE'
            ? 'closure'
            : 'other',
      severity,
      description,
      location,
      distanceFromRouteMeters: 0,
      startTime: null,
      expectedClearTime: null,
    };
    return [{ incident, delayInSeconds }];
  });
  const incidents = incidentsWithDelay
    .sort((first, second) => second.delayInSeconds - first.delayInSeconds)
    .slice(0, 8)
    .map(({ incident }) => incident);
  const from: Place = {
    placeId: 'current-location',
    displayName: origin.label,
    formattedAddress: origin.label,
    location: origin.coordinate,
  };
  const to: Place = {
    placeId: destination.placeId,
    displayName: destination.primaryText,
    formattedAddress: [destination.primaryText, destination.secondaryText]
      .filter(Boolean)
      .join(', '),
    location: destination.location,
  };

  return {
    routeId,
    name,
    distanceMeters: summary?.lengthInMeters ?? 0,
    durationSeconds,
    staticDurationSeconds,
    trafficDelaySeconds,
    congestion: classifyCongestion(durationSeconds, staticDurationSeconds),
    polyline,
    trafficSegments,
    incidents,
    legs: [
      {
        from,
        to,
        distanceMeters: summary?.lengthInMeters ?? 0,
        durationSeconds,
        staticDurationSeconds,
        steps: [],
      },
    ],
  };
}

export const routesService = {
  async getRouteStatus({ origin, destination, signal }: RouteStatusOptions): Promise<Route> {
    let response: TomTomRouteResponse;
    try {
      const query = [
        `key=${encodeURIComponent(apiConfiguration.tomTomApiKey)}`,
        'traffic=true',
        'travelMode=car',
        'routeType=fastest',
        'computeTravelTimeFor=all',
        'sectionType=traffic',
        'maxAlternatives=2',
        'alternativeType=anyRoute',
        'instructionsType=coded',
      ];
      response = await apiClient.request<TomTomRouteResponse>(
        `${ROUTING_BASE_URL}/calculateRoute/${origin.coordinate.latitude},${origin.coordinate.longitude}:${destination.location.latitude},${destination.location.longitude}/json?${query.join('&')}`,
        { signal },
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.kind === 'bad-request') {
        throw new ApiClientError(
          'No route was found between these places.',
          'no-route-found',
        );
      }
      throw error;
    }

    const tomTomRoute = response.routes?.[0];
    if (!tomTomRoute) {
      throw new ApiClientError(
        'No route was found between these places.',
        'no-route-found',
      );
    }

    const mainRouteId = 'current-location-' + destination.placeId;
    const usedNames = new Set<string>();
    const uniqueName = (candidate: string): string => {
      let name = candidate;
      let suffix = 2;
      while (usedNames.has(name)) {
        name = `${candidate} (${suffix})`;
        suffix += 1;
      }
      usedNames.add(name);
      return name;
    };
    const mainName = uniqueName(
      deriveRouteName(
        tomTomRoute.guidance?.instructions ?? tomTomRoute.instructions,
        tomTomRoute.summary?.lengthInMeters ?? 0,
      ) ?? 'Recommended route',
    );
    const mainRoute = buildRoute(tomTomRoute, origin, destination, mainRouteId, mainName);
    const alternatives = (response.routes ?? [])
      .slice(1)
      .flatMap((alternative, index) => {
        const summary = alternative.summary;
        if (
          typeof summary?.lengthInMeters !== 'number' ||
          typeof summary.travelTimeInSeconds !== 'number'
        ) {
          return [];
        }
        const hasPolyline = (alternative.legs?.flatMap((leg) => leg.points ?? []).length ?? 0) > 0;
        if (!hasPolyline) {
          return [];
        }
        const alternativeName = uniqueName(
          deriveRouteName(
            alternative.guidance?.instructions ?? alternative.instructions,
            summary.lengthInMeters,
          ) ?? `Alternative ${index + 1}`,
        );
        return [
          buildRoute(
            alternative,
            origin,
            destination,
            `${mainRouteId}-alternative-${index + 1}`,
            alternativeName,
          ),
        ];
      })
      .sort((first, second) => first.durationSeconds - second.durationSeconds)
      .slice(0, 2);

    return { ...mainRoute, alternatives };
  },
};