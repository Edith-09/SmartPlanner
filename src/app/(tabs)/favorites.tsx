import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FavoriteRouteStatus } from '@/components/FavoriteRouteStatus';
import { Button, Card, EmptyState, ErrorState } from '@/components/ui';
import { theme } from '@/config/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useFavorites } from '@/hooks/useFavorites';
import type { RouteOrigin } from '@/services/routes/routesService';
import type { FavoriteRoute } from '@/types/domain';

export default function FavoritesScreen() {
  const { colors } = useAppTheme();
  const location = useCurrentLocation();
  const { favorites, removeFavorite, markUsed } = useFavorites();
  const [openFavoriteId, setOpenFavoriteId] = useState<string | null>(null);
  const sortedFavorites = [...favorites].sort((first, second) => {
    const usageOrder = second.useCount - first.useCount;
    if (usageOrder !== 0) {
      return usageOrder;
    }
    return Date.parse(second.createdAt) - Date.parse(first.createdAt);
  });
  const origin: RouteOrigin | null =
    location.status === 'ready' && location.coordinate
      ? { coordinate: location.coordinate, label: location.label }
      : null;

  const toggleFavorite = (favorite: FavoriteRoute): void => {
    if (openFavoriteId === favorite.id) {
      setOpenFavoriteId(null);
      return;
    }
    setOpenFavoriteId(favorite.id);
    markUsed(favorite.id);
  };

  const confirmRemove = (favorite: FavoriteRoute): void => {
    Alert.alert(
      'Remove favorite?',
      `Remove ${favorite.label} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFavorite(favorite.id);
            if (openFavoriteId === favorite.id) {
              setOpenFavoriteId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.background }}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Smart Transport Planner</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Favorites</Text>
        </View>

        {favorites.length === 0 ? (
          <EmptyState
            title="No favorites yet"
            message="Plan a route and tap Save to favorites to see it here."
          />
        ) : (
          <>
            {location.status === 'loading' && (
              <Text style={[styles.locationMessage, { color: colors.secondaryText }]}>Finding your location…</Text>
            )}
            {(location.status === 'denied' ||
              location.status === 'blocked' ||
              location.status === 'error') && (
              <ErrorState
                message={location.message ?? 'Current location is unavailable.'}
                onRetry={location.retry}
              />
            )}
            {sortedFavorites.map((favorite) => {
              const isOpen = openFavoriteId === favorite.id;
              return (
                <View key={favorite.id} style={styles.favoriteGroup}>
                  <Card accessibilityLabel={`Favorite destination ${favorite.label}`}>
                    <View style={styles.favoriteContent}>
                      <View style={styles.favoriteText}>
                        <Text style={[styles.favoriteLabel, { color: colors.text }]}>
                          {favorite.label}
                        </Text>
                        <Text style={[styles.address, { color: colors.secondaryText }]}>
                          {favorite.to.formattedAddress}
                        </Text>
                      </View>
                      <View style={styles.actions}>
                        <Button
                          title={isOpen ? 'Hide' : 'Check traffic'}
                          variant="secondary"
                          accessibilityLabel={
                            isOpen
                              ? `Hide traffic status for ${favorite.label}`
                              : `Check traffic to ${favorite.label}`
                          }
                          onPress={() => toggleFavorite(favorite)}
                        />
                        <Button
                          title="Remove"
                          variant="ghost"
                          accessibilityLabel={`Remove ${favorite.label} from favorites`}
                          onPress={() => confirmRemove(favorite)}
                        />
                      </View>
                    </View>
                  </Card>
                  {isOpen && location.status === 'ready' && origin && (
                    <FavoriteRouteStatus favorite={favorite} origin={origin} />
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  locationMessage: {
    fontSize: theme.typography.body,
  },
  favoriteGroup: {
    gap: theme.spacing.md,
  },
  favoriteContent: {
    gap: theme.spacing.md,
  },
  favoriteText: {
    gap: theme.spacing.xs,
  },
  favoriteLabel: {
    fontSize: theme.typography.subheading,
    fontWeight: '700',
  },
  address: {
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
});
