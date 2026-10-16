export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export type CongestionLevel = 'light' | 'moderate' | 'heavy' | 'unknown';

export interface Place {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: Coordinate;
}

export interface TrafficSegment {
  startIndex: number;
  endIndex: number;
  congestion: CongestionLevel;
}

export interface RouteStep {
  instruction: string;
  roadName?: string;
  distanceMeters: number;
  durationSeconds: number;
  congestion: CongestionLevel;
}

export interface RouteLeg {
  from: Place;
  to: Place;
  distanceMeters: number;
  durationSeconds: number;
  staticDurationSeconds: number;
  steps: RouteStep[];
}

export interface Route {
  routeId: string;
  distanceMeters: number;
  durationSeconds: number;
  staticDurationSeconds: number;
  trafficDelaySeconds: number;
  congestion: CongestionLevel;
  polyline: Coordinate[];
  trafficSegments: TrafficSegment[];
  legs: RouteLeg[];
}

export type IncidentType = 'crash' | 'roadwork' | 'hazard' | 'closure' | 'other';
export type IncidentSource = 'tomtom' | 'local';
export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'unknown';

export interface Incident {
  id: string;
  source: IncidentSource;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: Coordinate;
  distanceFromRouteMeters: number;
  startTime: string | null;
  expectedClearTime: string | null;
}

export interface LocalReport extends Incident {
  source: 'local';
  note: string;
  createdAt: string;
  expiresAt: string;
  stillThereCount: number;
  clearedCount: number;
  confirmedByDevice: string[];
}

export interface FavoriteRoute {
  id: string;
  label: string;
  from: Place;
  to: Place;
  createdAt: string;
  useCount: number;
}