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
  ai_summary?: string;
}

export interface GeoInfo {
  countryCode: string;
}

export interface PlantingRisk {
  score: number;
  label: "Low" | "Moderate" | "High";
  reason: string;
}

export interface TreeHealth {
  healthy: number;
  needs_care: number;
  needs_replacement: number;
}

export interface TreeAnalysisResult {
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
  tree_health: TreeHealth;
  low_confidence: boolean;
  tree_species_guess: string;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string;
  cv_debug: {
    orig_resolution: string;
    peaks_detected: number;
    after_area_filter: number;
  };
}

export interface TreeQuota {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  resets_at: string;
}

export interface UsageStats {
  requests_used: number;
  requests_limit: number;
  ai_used: number;
  ai_limit: number;
  period_start: string;
  period_end: string;
}

export interface Farm {
  id: string;
  name: string;
  lat: number;
  lon: number;
  cropType: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code: string;
}
