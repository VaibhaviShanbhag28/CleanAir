import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';

export function useAQI(lat = 12.9716, lng = 77.5946) {
  const { setCurrentAQI } = useAppStore();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.weather.current(lat, lng) as { aqi: number };
        if (data.aqi) setCurrentAQI(data.aqi);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, [lat, lng, setCurrentAQI]);
}
