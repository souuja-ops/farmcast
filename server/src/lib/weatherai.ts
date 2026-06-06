import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "../config";

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  resetDate: Date;
}

export interface GeoInfo {
  countryCode: string;
}

export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_probability: number;
  wind_max: number;
  condition_code: string;
  icon: string;
  precipitation_sum?: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherCurrent {
  time: string;
  temperature: number;
  wind_speed: number;
  wind_direction?: number;
  condition_code: string;
  icon: string;
}

export interface WeatherResponse {
  location: {
    lat: number;
    lon: number;
    timezone: string;
    country: string;
  };
  current: WeatherCurrent;
  daily: WeatherDay[];
  hourly?: unknown[];
  ai_summary?: string;
}

export interface UsageResponse {
  requests_used: number;
  requests_limit: number;
  ai_used: number;
  ai_limit: number;
  period_start: string;
  period_end: string;
}

export interface TreeQuotaResponse {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  resets_at: string;
}

export interface TreeAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  farmer_id: string;
  county: string;
  location: string;
  land_acres: number;
  total_tree_count: number;
  tree_density_per_acre?: number;
  confidence_score: number;
  canopy_coverage_pct: number;
  tree_health: {
    healthy: number;
    needs_care: number;
    needs_replacement: number;
  };
  low_confidence: boolean;
  tree_species_guess: string;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string;
  cv_debug: {
    orig_resolution: string;
    work_resolution: string;
    canopy_px: number;
    peaks_detected: number;
    after_area_filter: number;
  };
}

export class WeatherAiApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly rateLimitRemaining?: number;
  readonly rateLimitReset?: number;

  constructor(
    message: string,
    status: number,
    code: string,
    rateLimit?: { remaining?: number; reset?: number },
  ) {
    super(message);
    this.name = "WeatherAiApiError";
    this.status = status;
    this.code = code;

    if (rateLimit?.remaining !== undefined) {
      this.rateLimitRemaining = rateLimit.remaining;
    }
    if (rateLimit?.reset !== undefined) {
      this.rateLimitReset = rateLimit.reset;
    }
  }
}

function getHeaderValue(
  headers: AxiosResponse["headers"],
  name: string,
): string | undefined {
  if (headers instanceof AxiosHeaders) {
    return headers.get(name)?.toString();
  }

  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0]?.toString();
  }

  return value?.toString();
}

function parseRateLimitHeaders(headers: AxiosResponse["headers"]): RateLimitInfo {
  const remaining = Number(getHeaderValue(headers, "x-ratelimit-remaining") ?? 0);
  const reset = Number(getHeaderValue(headers, "x-ratelimit-reset") ?? 0);

  return {
    remaining,
    reset,
    resetDate: new Date(reset * 1000),
  };
}

function parseGeoHeaders(headers: AxiosResponse["headers"]): GeoInfo {
  return {
    countryCode: getHeaderValue(headers, "x-country-code") ?? "",
  };
}

function extractErrorMessage(data: unknown): string {
  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;

    if (typeof record.error === "string") {
      return record.error;
    }
    if (typeof record.message === "string") {
      return record.message;
    }
    if (typeof record.detail === "string") {
      return record.detail;
    }
  }

  return "WeatherAI request failed";
}

function extractErrorCode(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.code === "string") {
      return record.code;
    }
  }

  return `HTTP_${status}`;
}

const client: AxiosInstance = axios.create({
  baseURL: config.weatherAiBaseUrl,
  timeout: 15000,
});

client.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
  requestConfig.headers.set(
    "Authorization",
    `Bearer ${config.weatherAiApiKey}`,
  );
  return requestConfig;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data, headers } = error.response;
      const remainingHeader = getHeaderValue(headers, "x-ratelimit-remaining");
      const resetHeader = getHeaderValue(headers, "x-ratelimit-reset");

      const rateLimit =
        remainingHeader !== undefined || resetHeader !== undefined
          ? {
              remaining:
                remainingHeader !== undefined
                  ? Number(remainingHeader)
                  : undefined,
              reset:
                resetHeader !== undefined ? Number(resetHeader) : undefined,
            }
          : undefined;

      throw new WeatherAiApiError(
        extractErrorMessage(data),
        status,
        extractErrorCode(data, status),
        rateLimit,
      );
    }

    throw new WeatherAiApiError(
      error.message || "WeatherAI request failed",
      0,
      "NETWORK_ERROR",
    );
  },
);

export async function fetchWeather(
  lat: number,
  lon: number,
  days: number,
  lang = "en",
  cropType?: string,
): Promise<{ data: WeatherResponse; rateLimit: RateLimitInfo }> {
  const params: Record<string, unknown> = {
    lat,
    lon,
    days,
    ai: true,
    units: "metric",
    lang,
  };

  if (typeof cropType === "string" && cropType.trim()) {
    params.cropType = cropType;
  }

  const response = await client.get<WeatherResponse>("/v1/weather", {
    params,
  });

  return {
    data: response.data,
    rateLimit: parseRateLimitHeaders(response.headers),
  };
}

export async function fetchWeatherByIp(): Promise<{
  data: WeatherResponse;
  geo: GeoInfo;
  rateLimit: RateLimitInfo;
}> {
  const response = await client.get<WeatherResponse>("/v1/weather-geo", {
    params: {
      ip: "auto",
      ai: true,
      units: "metric",
    },
  });

  return {
    data: response.data,
    geo: parseGeoHeaders(response.headers),
    rateLimit: parseRateLimitHeaders(response.headers),
  };
}

export async function fetchUsage(): Promise<UsageResponse> {
  const response = await client.get<UsageResponse>("/v1/usage");
  return response.data;
}

export async function fetchTreeQuota(): Promise<TreeQuotaResponse> {
  const response = await client.get<TreeQuotaResponse>("/v1/trees/quota");
  return response.data;
}

export async function analyzeTreeImage(
  formData: import("form-data"),
): Promise<TreeAnalysisResponse> {
  const response = await client.post<TreeAnalysisResponse>(
    "/v1/trees/analyze",
    formData,
    {
      headers: formData.getHeaders(),
    },
  );
  return response.data;
}
