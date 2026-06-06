import type { WeatherDay } from "../lib/weatherai";

export interface PlantingRisk {
  score: number;
  label: "Low" | "Moderate" | "High";
  reason: string;
}

const REASONS: Record<PlantingRisk["label"], string> = {
  High: "Heavy rainfall or extreme conditions expected. Avoid planting for at least 3 days.",
  Moderate:
    "Variable conditions. Monitor the forecast daily before any field work.",
  Low: "Stable conditions. Suitable for planting and field operations.",
};

export function calculatePlantingRisk(
  forecastDays: WeatherDay[],
): PlantingRisk {
  if (forecastDays.length === 0) {
    return { score: 0, label: "Low", reason: REASONS.Low };
  }

  const avgRainProb =
    forecastDays.reduce((sum, day) => sum + day.precipitation_probability, 0) /
    forecastDays.length;

  const maxTempVariance = Math.max(
    ...forecastDays.map((day) => day.temp_max - day.temp_min),
  );

  const avgWindSpeed =
    forecastDays.reduce((sum, day) => sum + day.wind_max, 0) /
    forecastDays.length;

  const rainScore = avgRainProb * 0.4;
  const tempScore = Math.min((maxTempVariance / 15) * 35, 35);
  const windScore = Math.min((avgWindSpeed / 50) * 25, 25);

  const score = Math.round(rainScore + tempScore + windScore);

  let label: PlantingRisk["label"];
  if (score >= 65) {
    label = "High";
  } else if (score >= 35) {
    label = "Moderate";
  } else {
    label = "Low";
  }

  return { score, label, reason: REASONS[label] };
}
