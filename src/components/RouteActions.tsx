import { Alert, Linking, Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { theme } from '@/config/theme';
import type { Coordinate, Route } from '@/types/domain';
import { formatDuration } from '@/utils/format';

interface RouteActionsProps {
  route: Route;
  destinationName: string;
  origin: Coordinate | null;
  destination: Coordinate;
}

function formatCoordinate(coordinate: Coordinate): string {
  return `${coordinate.latitude},${coordinate.longitude}`;
}

export function RouteActions({ route, destinationName, origin, destination }: RouteActionsProps) {
  const startNavigation = (): void => {
    const originParameter = origin ? `&origin=${formatCoordinate(origin)}` : '';
    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${formatCoordinate(destination)}` +
      `${originParameter}&travelmode=driving`;

    void Linking.openURL(url).catch(() => {
      Alert.alert('Could not open maps', 'Please check that a maps app or browser is available.');
    });
  };

  const shareStatus = (): void => {
    const delay = route.trafficDelaySeconds >= 60
      ? `, ${formatDuration(route.trafficDelaySeconds)} slower than usual`
      : '';
    const traffic =
      route.congestion === 'light'
        ? ' (light traffic)'
        : route.congestion === 'moderate'
          ? ' (moderate traffic)'
          : route.congestion === 'heavy'
            ? ' (heavy traffic)'
            : '';
    const message =
      `${destinationName}: ${formatDuration(route.durationSeconds)} by car` +
      `${delay}${traffic} - via Smart Transport Planner`;

    void Share.share({ message });
  };

  return (
    <View style={styles.row}>
      <View style={styles.button}>
        <Button
          title="Start navigation"
          onPress={startNavigation}
          accessibilityLabel="Start navigation to destination"
        />
      </View>
      <View style={styles.button}>
        <Button
          title="Share status"
          variant="secondary"
          onPress={shareStatus}
          accessibilityLabel="Share route status"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});