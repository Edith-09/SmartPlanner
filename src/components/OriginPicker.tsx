import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ListItem, TextField } from '@/components/ui';
import { theme } from '@/config/theme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { usePlaceSuggestions } from '@/hooks/usePlaceSuggestions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { locationService } from '@/services/location/locationService';
import { ApiClientError } from '@/services/api/apiClient';
import type { PlaceSuggestion } from '@/services/places/placesService';

interface OriginPickerProps {
  location: ReturnType<typeof useCurrentLocation>;
  selected: PlaceSuggestion | null;
  onSelect: (place: PlaceSuggestion | null) => void;
}

export function OriginPicker({ location, selected, onSelect }: OriginPickerProps) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const suggestions = usePlaceSuggestions(editing ? query : '', location.coordinate);
  const trimmedQuery = query.trim();
  const showResults =
    editing &&
    trimmedQuery.length >= 3 &&
    suggestions.debouncedText === trimmedQuery &&
    suggestions.isSuccess;
  const errorMessage = suggestions.error instanceof ApiClientError
    ? suggestions.error.message
    : suggestions.error instanceof Error
      ? suggestions.error.message
      : 'Places could not be loaded.';

  const useMyLocation = (): void => {
    onSelect(null);
    setQuery('');
    setEditing(false);
  };

  const cancelEditing = (): void => {
    setQuery('');
    setEditing(false);
  };

  const selectSuggestion = (suggestion: PlaceSuggestion): void => {
    Keyboard.dismiss();
    onSelect(suggestion);
    setQuery('');
    setEditing(false);
  };

  return (
    <Card accessibilityLabel="Starting point">
      <View style={styles.content}>
        {editing ? (
          <>
            <TextField
              label="Starting point"
              placeholder="Type a place or address"
              autoCorrect={false}
              autoFocus
              returnKeyType="search"
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Starting point"
            />
            {suggestions.isPending && trimmedQuery.length >= 3 ? (
              <Text style={[styles.message, { color: colors.secondaryText }]}>Searching places…</Text>
            ) : null}
            {suggestions.isError ? (
              <Text accessibilityRole="alert" style={[styles.message, { color: colors.danger }]}>
                {errorMessage}
              </Text>
            ) : null}
            {showResults && suggestions.data.length === 0 ? (
              <Text style={[styles.message, { color: colors.secondaryText }]}>No places found.</Text>
            ) : null}
            {showResults
              ? suggestions.data.map((suggestion, index) => (
                  <View key={suggestion.placeId}>
                    {index > 0 ? (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    ) : null}
                    <ListItem
                      title={suggestion.primaryText}
                      subtitle={suggestion.secondaryText}
                      onPress={() => selectSuggestion(suggestion)}
                      accessibilityLabel={`Starting point ${suggestion.primaryText}, ${suggestion.secondaryText}`}
                    />
                  </View>
                ))
              : null}
            <View style={styles.actions}>
              <Button
                title="Use my location"
                variant="secondary"
                onPress={useMyLocation}
                accessibilityLabel="Use my current location as the starting point"
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={cancelEditing}
                accessibilityLabel="Cancel starting point search"
              />
            </View>
          </>
        ) : selected ? (
          <>
            <Text style={[styles.caption, { color: colors.secondaryText }]}>From</Text>
            <ListItem
              title={selected.primaryText}
              subtitle={selected.secondaryText}
              accessibilityLabel={`Starting point ${selected.primaryText}, ${selected.secondaryText}`}
            />
            <View style={styles.actions}>
              <Button
                title="Change"
                variant="secondary"
                onPress={() => setEditing(true)}
                accessibilityLabel="Change starting point"
              />
              <Button
                title="Use my location"
                variant="secondary"
                onPress={useMyLocation}
                accessibilityLabel="Use my current location as the starting point"
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.caption, { color: colors.secondaryText }]}>From</Text>
            {location.status === 'loading' ? (
              <ListItem
                title="My location"
                subtitle="Finding your location…"
                accessibilityLabel="Starting point: my location, finding your location"
              />
            ) : location.status === 'ready' ? (
              <ListItem
                title="My location"
                subtitle={location.label}
                accessibilityLabel={`Starting point: my location, ${location.label}`}
              />
            ) : location.status === 'denied' ? (
              <>
                <ListItem
                  title="Location access needed"
                  subtitle="Allow location, or type a starting point."
                  accessibilityLabel="Location access needed. Allow location, or type a starting point."
                />
                <Button
                  title="Allow location"
                  variant="secondary"
                  onPress={location.retry}
                  accessibilityLabel="Allow current location access"
                />
              </>
            ) : location.status === 'blocked' ? (
              <>
                <ListItem
                  title="Location is blocked"
                  subtitle="Enable it in your device settings, or type a starting point."
                  accessibilityLabel="Location is blocked. Enable it in your device settings, or type a starting point."
                />
                <Button
                  title="Open settings"
                  variant="secondary"
                  onPress={() => void locationService.openSettings()}
                  accessibilityLabel="Open device location settings"
                />
              </>
            ) : (
              <>
                <ListItem
                  title="Can't get your location"
                  subtitle={location.message ?? 'Check that location services are turned on.'}
                  accessibilityLabel={`Can't get your location. ${location.message ?? 'Check that location services are turned on.'}`}
                />
                <Button
                  title="Try again"
                  variant="secondary"
                  onPress={location.retry}
                  accessibilityLabel="Try getting current location again"
                />
              </>
            )}
            <Button
              title="Change"
              variant="secondary"
              onPress={() => setEditing(true)}
              accessibilityLabel="Enter a different starting point"
            />
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
  },
  caption: {
    fontSize: theme.typography.caption,
  },
  message: {
    fontSize: theme.typography.body,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});