import { useState, useEffect, useCallback } from 'react';

interface GeolocationData {
  city: string;
  neighborhood?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface GeolocationReturn {
  location: GeolocationData;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const OUAGADOUGOU_NEIGHBORHOODS = [
  { name: 'Ouaga 2000', lat: 12.3750, lng: -1.5050, bounds: { latMin: 12.365, latMax: 12.385, lngMin: -1.520, lngMax: -1.490 } },
  { name: 'Cissin', lat: 12.3800, lng: -1.5450, bounds: { latMin: 12.370, latMax: 12.390, lngMin: -1.560, lngMax: -1.530 } },
  { name: 'Tampouy', lat: 12.3900, lng: -1.4950, bounds: { latMin: 12.380, latMax: 12.400, lngMin: -1.510, lngMax: -1.480 } },
  { name: 'Gounghin', lat: 12.3550, lng: -1.5250, bounds: { latMin: 12.345, latMax: 12.365, lngMin: -1.540, lngMax: -1.510 } },
  { name: 'Dapoya', lat: 12.3650, lng: -1.5100, bounds: { latMin: 12.355, latMax: 12.375, lngMin: -1.520, lngMax: -1.500 } },
  { name: 'Somgandé', lat: 12.3950, lng: -1.5300, bounds: { latMin: 12.385, latMax: 12.405, lngMin: -1.540, lngMax: -1.520 } },
  { name: 'Kossodo', lat: 12.4100, lng: -1.4800, bounds: { latMin: 12.400, latMax: 12.420, lngMin: -1.490, lngMax: -1.470 } },
  { name: 'Zogona', lat: 12.3600, lng: -1.5300, bounds: { latMin: 12.350, latMax: 12.370, lngMin: -1.540, lngMax: -1.520 } },
  { name: 'Patte d\'Oie', lat: 12.3850, lng: -1.5500, bounds: { latMin: 12.375, latMax: 12.395, lngMin: -1.560, lngMax: -1.540 } },
  { name: 'Bogodogo', lat: 12.3450, lng: -1.4900, bounds: { latMin: 12.335, latMax: 12.355, lngMin: -1.500, lngMax: -1.480 } }
];

const CACHE_KEY = 'user_location';
const CACHE_TIMESTAMP_KEY = 'user_location_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const detectNeighborhood = (lat: number, lng: number): string | undefined => {
  for (const neighborhood of OUAGADOUGOU_NEIGHBORHOODS) {
    if (
      lat >= neighborhood.bounds.latMin &&
      lat <= neighborhood.bounds.latMax &&
      lng >= neighborhood.bounds.lngMin &&
      lng <= neighborhood.bounds.lngMax
    ) {
      return neighborhood.name;
    }
  }
  return undefined;
};

export const useGeolocation = (): GeolocationReturn => {
  const [location, setLocation] = useState<GeolocationData>({
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    neighborhood: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first (5 min)
      const cachedLocation = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedLocation && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < CACHE_DURATION) {
          setLocation(JSON.parse(cachedLocation));
          setIsLoading(false);
          return;
        }
      }

      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: CACHE_DURATION
          });
        });

        const { latitude, longitude } = position.coords;
        const neighborhood = detectNeighborhood(latitude, longitude);
        
        const locationData: GeolocationData = {
          city: 'Ouagadougou',
          country: 'Burkina Faso',
          neighborhood,
          latitude,
          longitude
        };
        
        setLocation(locationData);
        localStorage.setItem(CACHE_KEY, JSON.stringify(locationData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        setLocation({ 
          city: 'Ouagadougou',
          country: 'Burkina Faso'
        });
      }
    } catch (err) {
      setError(err as Error);
      setLocation({ 
        city: 'Ouagadougou',
        country: 'Burkina Faso'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Execute once on mount to avoid infinite loop

  return {
    location,
    isLoading,
    error,
    refresh: fetchLocation
  };
};
