import { useCallback, useState } from "react";
import axios from "axios";
import api, { getApiErrorMessage } from "../lib/api";
import type { ApiResponse, TreeAnalysisResult } from "../types";

interface UseTreeAnalysisState {
  result: TreeAnalysisResult | null;
  loading: boolean;
  error: string | null;
}

export function useTreeAnalysis() {
  const [state, setState] = useState<UseTreeAnalysisState>({
    result: null,
    loading: false,
    error: null,
  });

  const analyzeImage = useCallback(async (formData: FormData) => {
    setState({ result: null, loading: true, error: null });

    try {
      const { data } = await api.post<ApiResponse<TreeAnalysisResult>>(
        "/api/trees/analyze",
        formData,
      );

      setState({
        result: data.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        result: null,
        loading: false,
        error: getApiErrorMessage(error, "Failed to analyze image"),
      });
    }
  }, []);

  const loadLatestFromHistory = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data } = await api.get<
        ApiResponse<{
          analyses: TreeAnalysisResult[];
          nextCursor: string | null;
        }>
      >("/api/trees/history", { params: { limit: 1 } });

      const latest = data?.data?.analyses?.[0];
      if (latest) {
        setState((prev) => ({ ...prev, result: latest, loading: false }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      // Map server 5xx errors to a friendly message
      let message = getApiErrorMessage(error, "Failed to load history");

      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        if (status >= 500) {
          message = "Tree analysis service temporarily unavailable. Please try again later.";
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      // eslint-disable-next-line no-console
      console.error("Failed to load history:", error);
    }
  }, []);

  return { ...state, analyzeImage, loadLatestFromHistory };
}
