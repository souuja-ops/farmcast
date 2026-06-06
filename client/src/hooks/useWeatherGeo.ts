import { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../lib/api";
import type {
  ApiResponse,
  GeoInfo,
  PlantingRisk,
  WeatherResponse,
} from "../types";

interface UseWeatherGeoState {
  weather: WeatherResponse | null;
  plantingRisk: PlantingRisk | null;
  geo: GeoInfo | null;
  loading: boolean;
  error: string | null;
}

export function useWeatherGeo() {
  const [state, setState] = useState<UseWeatherGeoState>({
    weather: null,
    plantingRisk: null,
    geo: null,
    loading: true,
    error: null,
  });

  const fetchWeatherGeo = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await api.get<
        ApiResponse<{
          weather: WeatherResponse;
          plantingRisk: PlantingRisk;
          geo: GeoInfo;
        }>
      >("/api/weather/geo");

      setState({
        weather: data.data.weather,
        plantingRisk: data.data.plantingRisk,
        geo: data.data.geo,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        weather: null,
        plantingRisk: null,
        geo: null,
        loading: false,
        error: getApiErrorMessage(error, "Failed to fetch location weather"),
      });
    }
  }, []);

  useEffect(() => {
    void fetchWeatherGeo();
  }, [fetchWeatherGeo]);

  return { ...state, refetch: fetchWeatherGeo };
}
