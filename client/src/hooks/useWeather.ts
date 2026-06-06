import { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../lib/api";
import type {
  ApiResponse,
  PlantingRisk,
  WeatherResponse,
} from "../types";

interface UseWeatherProps {
  lat: number | null;
  lon: number | null;
  cropType?: string;
}

interface UseWeatherState {
  weather: WeatherResponse | null;
  plantingRisk: PlantingRisk | null;
  loading: boolean;
  error: string | null;
}

export function useWeather({ lat, lon, cropType }: UseWeatherProps) {
  const [state, setState] = useState<UseWeatherState>({
    weather: null,
    plantingRisk: null,
    loading: false,
    error: null,
  });

  const fetchWeather = useCallback(async () => {
    if (lat === null || lon === null) {
      setState({
        weather: null,
        plantingRisk: null,
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await api.get<
        ApiResponse<{ weather: WeatherResponse; plantingRisk: PlantingRisk }>
      >("/api/weather", {
        params: {
          lat,
          lon,
          days: 7,
          ...(typeof cropType === "string" && cropType.trim()
            ? { cropType }
            : {}),
        },
      });

      setState({
        weather: data.data.weather,
        plantingRisk: data.data.plantingRisk,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        weather: null,
        plantingRisk: null,
        loading: false,
        error: getApiErrorMessage(error, "Failed to fetch weather"),
      });
    }
  }, [lat, lon, cropType]);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  return { ...state, refetch: fetchWeather };
}
