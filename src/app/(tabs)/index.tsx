import { useMemo, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteStatusCard } from '@/components/RouteStatusCard';
import { RouteMap } from '@/components/RouteMap';
import { RouteReports } from '@/components/RouteReports';
import { RouteAlerts } from '@/components/RouteAlerts';
import { AlternativeRoutes } from '@/components/AlternativeRoutes';
import { OnboardingModal } from '@/components/OnboardingModal';
import { OriginPicker } from '@/components/OriginPicker';
import { RecentSearches } from '@/components/RecentSearches';
import { RouteActions } from '@/components/RouteActions';
import { SaveRouteButton } from '@/components/SaveRouteButton';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import {
  Card,
  ErrorState,
  ListItem,
  Skeleton,
  TextField,
} from '@/components/ui';
import { apiConfiguration } from '@/config/environment';
import { theme } from '@/config/theme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { usePlaceSuggestions } from '@/hooks/usePlaceSuggestions';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useRouteStatus } from '@/hooks/useRouteStatus';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { PlaceSuggestion } from '@/services/places/placesService';
import type { RouteOrigin } from '@/services/routes/routesService';

export default function PlanScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {apiConfiguration.tomTomApiKey ? (
        <PlanContent />
      ) : (
        <ErrorState
          message="Add EXPO_PUBLIC_TOMTOM_API_KEY to your .env file, then restart Expo with: npx expo start -c"
        />
      )}
      <OnboardingModal />
    </SafeAreaView>
  );
}

function PlanContent() {
  const { colors } = useAppTheme();
  const location = useCurrentLocation();
  const { addRecent } = useRecentSearches();
  const [destinationText, setDestinationText] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<PlaceSuggestion | null>(null);
  const [typedOrigin, setTypedOrigin] = useState<PlaceSuggestion | null>(null);
  const [routeSelection, setRouteSelection] = useState<{ placeId: string; name: string } | null>(null);
  const origin = useMemo<RouteOrigin | null>(() => {
    if (typedOrigin) {
      return { coordinate: typedOrigin.location, label: typedOrigin.primaryText };
    }
    return location.status === 'ready' && location.coordinate
      ? { coordinate: location.coordinate, label: location.label }
      : null;
  }, [location.coordinate, location.label, location.status, typedOrigin]);
  const suggestions = usePlaceSuggestions(destinationText, origin?.coordinate ?? null);
  const route = useRouteStatus(origin, selectedDestination);
  const displayedRoute = selectedDestination && route.data
    ? (() => {
        const candidates = [route.data, ...(route.data.alternatives ?? [])];
        if (routeSelection?.placeId === selectedDestination.placeId) {
          return candidates.find((candidate) => candidate.name === routeSelection.name) ?? route.data;
        }
        return route.data;
      })()
    : null;
  const trimmedText = destinationText.trim();
  const showSuggestions =
    selectedDestination === null &&
    trimmedText.length >= 3 &&
    suggestions.debouncedText === trimmedText;

  const selectDestination = (suggestion: PlaceSuggestion): void => {
    Keyboard.dismiss();
    setSelectedDestination(suggestion);
    setDestinationText(suggestion.primaryText);
    addRecent(suggestion);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.header}>
        <View style={styles.headerTopLine}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Smart Transport Planner</Text>
          <ThemeToggleButton />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Where to?</Text>
      </View>

      <OriginPicker location={location} selected={typedOrigin} onSelect={setTypedOrigin} />

      <TextField
        label="Destination"
        placeholder="Type a place or address"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        value={destinationText}
        onChangeText={(text) => {
          setDestinationText(text);
          setSelectedDestination(null);
        }}
      />
      {selectedDestination === null && trimmedText.length === 0 ? (
        <RecentSearches onSelect={selectDestination} />
      ) : null}

      {showSuggestions && (
        <Card accessibilityLabel="Place suggestions">
          {suggestions.isPending && (
            <Text style={[styles.message, { color: colors.secondaryText }]}>Searching places…</Text>
          )}
          {suggestions.isError && (
            <Text accessibilityRole="alert" style={[styles.message, { color: colors.danger }]}> 
              {suggestions.error instanceof Error
                ? suggestions.error.message
                : 'Places could not be loaded.'}
            </Text>
          )}
          {suggestions.isSuccess && suggestions.data.length === 0 && (
            <Text style={[styles.message, { color: colors.secondaryText }]}>No places found.</Text>
          )}
          {suggestions.isSuccess && suggestions.data.map((suggestion, index) => (
            <View key={suggestion.placeId}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <ListItem
                title={suggestion.primaryText}
                subtitle={suggestion.secondaryText}
                onPress={() => selectDestination(suggestion)}
                accessibilityLabel={`${suggestion.primaryText}, ${suggestion.secondaryText}`}
              />
            </View>
          ))}
        </Card>
      )}

      {selectedDestination && !origin && (
        <Text style={[styles.message, { color: colors.secondaryText }]}>
          Choose a starting point or allow location access to see the route.
        </Text>
      )}
      {selectedDestination && origin && route.isLoading && (
        <Card accessibilityLabel="Loading route status">
          <View style={styles.skeletonGroup}>
            <Skeleton width={112} height={32} />
            <Skeleton width="75%" height={28} />
            <Skeleton width="45%" height={36} />
            <Skeleton width="60%" />
            <Skeleton width="100%" height={48} />
          </View>
        </Card>
      )}
      {selectedDestination && origin && route.isError && (
        <ErrorState
          message={route.error instanceof Error ? route.error.message : 'Route status could not be loaded.'}
          onRetry={() => void route.refetch()}
        />
      )}
      {selectedDestination && origin && route.data && displayedRoute && (
            <>
              <Text style={[styles.showingRoute, { color: colors.secondaryText }]}>
                Showing: {displayedRoute.name}
              </Text>
              {origin ? (
                <RouteMap
                  selectedRoute={displayedRoute}
                  alternatives={[route.data, ...(route.data.alternatives ?? [])].filter(
                    (candidate) => candidate !== displayedRoute,
                  )}
                  origin={origin.coordinate}
                />
              ) : null}
              <RouteStatusCard
                route={displayedRoute}
                destinationName={selectedDestination.primaryText}
                updatedAt={route.dataUpdatedAt}
              />
              <RouteActions
                route={displayedRoute}
                destinationName={selectedDestination.primaryText}
                origin={typedOrigin ? typedOrigin.location : null}
                destination={displayedRoute.legs[0].to.location}
              />
              <AlternativeRoutes
                route={route.data}
                selectedName={displayedRoute.name ?? ''}
                onSelect={(name) => setRouteSelection({ placeId: selectedDestination.placeId, name })}
              />
              <RouteAlerts route={displayedRoute} />
              <RouteReports route={displayedRoute} />
              <SaveRouteButton route={route.data} />
            </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  headerTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: theme.typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: theme.typography.display,
    fontWeight: '700',
  },
  showingRoute: {
    fontSize: theme.typography.caption,
  },
  message: {
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  skeletonGroup: {
    gap: theme.spacing.md,
  },
});
