import { StyleSheet, View } from 'react-native';

import { RouteStatusCard } from '@/components/RouteStatusCard';
import { Card, ErrorState, Skeleton } from '@/components/ui';
import { theme } from '@/config/theme';
import { useRouteStatus } from '@/hooks/useRouteStatus';
import type { RouteOrigin } from '@/services/routes/routesService';
import type { FavoriteRoute } from '@/types/domain';

interface FavoriteRouteStatusProps {
  favorite: FavoriteRoute;
  origin: RouteOrigin;
}

export function FavoriteRouteStatus({ favorite, origin }: FavoriteRouteStatusProps) {
  const destination = {
    placeId: favorite.to.placeId,
    primaryText: favorite.to.displayName,
    secondaryText: favorite.to.formattedAddress,
    location: favorite.to.location,
  };
  const route = useRouteStatus(origin, destination);

  if (route.isLoading) {
    return (
      <Card accessibilityLabel={`Loading traffic status for ${favorite.label}`}>
        <View style={styles.skeletons}>
          <Skeleton width={112} height={32} />
          <Skeleton width="75%" height={28} />
          <Skeleton width="45%" height={36} />
          <Skeleton width="60%" />
          <Skeleton width="100%" height={48} />
        </View>
      </Card>
    );
  }

  if (route.isError) {
    return (
      <ErrorState
        message={route.error instanceof Error ? route.error.message : 'Route status could not be loaded.'}
        onRetry={() => void route.refetch()}
      />
    );
  }

  if (!route.data) {
    return null;
  }

  return (
    <RouteStatusCard
      route={route.data}
      destinationName={favorite.label}
      updatedAt={route.dataUpdatedAt}
    />
  );
}

const styles = StyleSheet.create({
  skeletons: {
    gap: theme.spacing.md,
  },
});