import { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../lib/api";
import type { ApiResponse, TreeQuota, UsageStats } from "../types";

interface UseQuotaState {
  usage: UsageStats | null;
  treeQuota: TreeQuota | null;
  loading: boolean;
  error: string | null;
}

export function useQuota() {
  const [state, setState] = useState<UseQuotaState>({
    usage: null,
    treeQuota: null,
    loading: true,
    error: null,
  });

  const fetchQuota = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data } = await api.get<
        ApiResponse<{ usage: UsageStats; treeQuota: TreeQuota }>
      >("/api/weather/usage");

      setState({
        usage: data.data.usage,
        treeQuota: data.data.treeQuota,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        usage: null,
        treeQuota: null,
        loading: false,
        error: getApiErrorMessage(error, "Failed to fetch quota"),
      });
    }
  }, []);

  useEffect(() => {
    void fetchQuota();
  }, [fetchQuota]);

  return { ...state, refetch: fetchQuota };
}
