import { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../lib/api";
import type { ApiResponse, Farm } from "../types";

interface CreateFarmInput {
  name: string;
  lat: number;
  lon: number;
  cropType: string;
}

interface UseFarmsState {
  farms: Farm[];
  loading: boolean;
  error: string | null;
}

export function useFarms() {
  const [state, setState] = useState<UseFarmsState>({
    farms: [],
    loading: true,
    error: null,
  });

  const fetchFarms = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await api.get<ApiResponse<Farm[]>>("/api/farms");
      setState({ farms: data.data, loading: false, error: null });
    } catch (error) {
      setState({
        farms: [],
        loading: false,
        error: getApiErrorMessage(error, "Failed to fetch farms"),
      });
    }
  }, []);

  useEffect(() => {
    void fetchFarms();
  }, [fetchFarms]);

  const addFarm = useCallback(
    async (input: CreateFarmInput) => {
      const { data } = await api.post<
        ApiResponse<Omit<Farm, "createdAt">>
      >("/api/farms", input);

      const newFarm: Farm = {
        ...data.data,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        farms: [newFarm, ...prev.farms],
        error: null,
      }));

      return newFarm;
    },
    [],
  );

  const deleteFarm = useCallback(async (id: string) => {
    await api.delete(`/api/farms/${id}`);
    setState((prev) => ({
      ...prev,
      farms: prev.farms.filter((farm) => farm.id !== id),
      error: null,
    }));
  }, []);

  return {
    ...state,
    refetch: fetchFarms,
    addFarm,
    deleteFarm,
  };
}
