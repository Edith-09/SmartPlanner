import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteStatusCard } from '@/components/RouteStatusCard';
import { RouteAlerts } from '@/components/RouteAlerts';
import { AlternativeRoutes } from '@/components/AlternativeRoutes';
import { SaveRouteButton } from '@/components/SaveRouteButton';
import {
  Button,
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
import { useRouteStatus } from '@/hooks/useRouteStatus';
import { useAppTheme } from '@/hooks/useAppTheme';
import { locationService } from '@/services/location/locationService';
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
    </SafeAreaView>
  );
}

function PlanContent() {
  const { colors } = useAppTheme();
  const location = useCurrentLocation();
  const [destinationText, setDestinationText] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<PlaceSuggestion | null>(null);
  const [routeSelection, setRouteSelection] = useState<{ placeId: string; name: string } | null>(null);
  const suggestions = usePlaceSuggestions(destinationText, location.coordinate);
  const origin: RouteOrigin | null =
    location.status === 'ready' && location.coordinate
      ? { coordinate: location.coordinate, label: location.label }
      : null;
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
    location.status === 'ready' &&
    selectedDestination === null &&
    trimmedText.length >= 3 &&
    suggestions.debouncedText === trimmedText;

  const selectDestination = (suggestion: PlaceSuggestion): void => {
    Keyboard.dismiss();
    setSelectedDestination(suggestion);
    setDestinationText(suggestion.primaryText);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Smart Transport Planner</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Where to?</Text>
      </View>

      {location.status === 'loading' && (
        <View accessibilityLabel="Finding your location" style={styles.locationLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.secondaryText }]}>Finding your location…</Text>
        </View>
      )}
      {location.status === 'ready' && (
        <Text accessibilityLabel={`From: ${location.label}`} style={[styles.locationText, { color: colors.secondaryText }]}>
          From: {location.label}
        </Text>
      )}
      {location.status === 'denied' && (
        <ErrorState
          message={location.message ?? 'Location permission is needed to plan a route.'}
          retryLabel="Allow location"
          onRetry={location.retry}
        />
      )}
      {location.status === 'blocked' && (
        <View style={styles.permissionError}>
          <ErrorState message={location.message ?? 'Enable location access in device settings.'} />
          <Button title="Open settings" onPress={() => void locationService.openSettings()} />
        </View>
      )}
      {location.status === 'error' && (
        <ErrorState
          message={location.message ?? 'Unable to determine your location.'}
          onRetry={location.retry}
        />
      )}

      {location.status === 'ready' && (
        <>
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

          {selectedDestination && route.isLoading && (
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
          {selectedDestination && route.isError && (
            <ErrorState
              message={route.error instanceof Error ? route.error.message : 'Route status could not be loaded.'}
              onRetry={() => void route.refetch()}
            />
          )}
          {selectedDestination && route.data && displayedRoute && (
            <>
              <Text style={[styles.showingRoute, { color: colors.secondaryText }]}>
                Showing: {displayedRoute.name}
              </Text>
              <RouteStatusCard
                route={displayedRoute}
                destinationName={selectedDestination.primaryText}
                updatedAt={route.dataUpdatedAt}
              />
              <AlternativeRoutes
                route={route.data}
                selectedName={displayedRoute.name ?? ''}
                onSelect={(name) => setRouteSelection({ placeId: selectedDestination.placeId, name })}
              />
              <RouteAlerts route={displayedRoute} />
              <SaveRouteButton route={route.data} />
            </>
          )}
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
  eyebrow: {
    fontSize: theme.typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: theme.typography.display,
    fontWeight: '700',
  },
  locationLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 44,
  },
  locationText: {
    fontSize: theme.typography.body,
  },
  showingRoute: {
    fontSize: theme.typography.caption,
  },
  permissionError: {
    gap: theme.spacing.md,
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
