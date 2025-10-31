
'use client';

import { useState } from 'react';

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | null;
  data: GeolocationCoordinates | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    data: null,
  });

  const getLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        setState(s => ({ ...s, error: new GeolocationPositionError() }));
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
    }

    setState({ loading: true, error: null, data: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          error: null,
          data: position.coords,
        });
      },
      (error) => {
        setState({
          loading: false,
          error,
          data: null,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 secondes
        maximumAge: 0, // Ne pas utiliser de position en cache
      }
    );
  };

  return { ...state, getLocation };
};
