import { useCallback, useEffect, useState } from 'react';

import { locationService } from '@/services/location/locationService';
import type { Coordinate } from '@/types/domain';

type CurrentLocationStatus = 'loading' | 'ready' | 'denied' | 'blocked' | 'error';

interface CurrentLocationState {
  status: CurrentLocationStatus;
  coordinate: Coordinate | null;
  label: string;
  message?: string;
}

export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    status: 'loading',
    coordinate: null,
    label: '',
  });

  const loadLocation = useCallback(async () => {
    try {
      let permission = await locationService.checkPermission();
      if (permission.state !== 'granted' && permission.canAskAgain) {
        permission = await locationService.requestPermission();
      }
      if (permission.state !== 'granted') {
        setState({
          status: permission.state,
          coordinate: null,
          label: '',
          message:
            permission.state === 'blocked'
              ? 'Location access is blocked. Enable it in device settings.'
              : 'Location access is needed to plan a route from your current location.',
        });
        return;
      }

      const coordinate = await locationService.getCurrentPosition();
      const label = await locationService.reverseGeocodeLabel(coordinate);
      setState({ status: 'ready', coordinate, label });
    } catch (error) {
      setState({
        status: 'error',
        coordinate: null,
        label: '',
        message: error instanceof Error ? error.message : 'Unable to determine your location.',
      });
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => void loadLocation(), 0);
    return () => clearTimeout(timeout);
  }, [loadLocation]);

  const retry = useCallback(() => {
    setState({ status: 'loading', coordinate: null, label: '' });
    void loadLocation();
  }, [loadLocation]);

  return { ...state, retry };
}