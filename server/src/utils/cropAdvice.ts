import Groq from "groq-sdk";
import { config } from "../config";
import type { PlantingRisk } from "./plantingRisk";
import type { WeatherDay } from "../lib/weatherai";

const groq = new Groq({ apiKey: config.groqApiKey });

export async function getCropAdvice(
  cropType: string,
  risk: PlantingRisk,
  forecast: WeatherDay[],
  location?: { lat: number; lon: number; country: string },
): Promise<string> {
  if (!config.groqApiKey) return risk.reason;

  const avgRain = Math.round(
    forecast.reduce((s, d) => s + d.precipitation_probability, 0) /
    forecast.length
  );
  const maxTemp = Math.max(...forecast.map((d) => d.temp_max));
  const minTemp = Math.min(...forecast.map((d) => d.temp_min));
  const avgWind = Math.round(
    forecast.reduce((s, d) => s + d.wind_max, 0) / forecast.length
  );

  const locationContext = location
    ? `Farm location: latitude ${location.lat}, 
       longitude ${location.lon}, country ${location.country}`
    : "Farm location: Kenya";

  const prompt = `You are an agronomist assistant for smallholder 
farmers in East Africa.

${locationContext}

Current weather forecast:
- Risk level: ${risk.label} (score ${risk.score}/100)
- Average rain probability: ${avgRain}%
- Temperature range: ${minTemp}°C to ${maxTemp}°C
- Average wind speed: ${avgWind} km/h

Daily breakdown:
${forecast
    .slice(0, 3)
    .map(
      (d) =>
        `  ${d.date}: ${d.temp_max}°C high, ${d.temp_min}°C low, ` +
        `${d.precipitation_probability}% rain, ${d.wind_max} km/h wind`,
    )
    .join("\n")}

The farmer wants to grow: ${cropType}

Give 2-3 sentences of specific practical advice for growing 
${cropType} in these exact weather conditions at this location.
Consider local climate and crop-specific risks from the forecast.
Be direct. No preamble. No greeting. No sign-off.
Write so a smallholder farmer can immediately act on your advice.`;

  try {
    const MODELS = ["llama-3.1-8b-instant"];

    let completion: any = undefined;
    let lastError: unknown = undefined;

    for (const candidate of MODELS) {
      try {
        // eslint-disable-next-line no-console
        console.info("[FarmCast] attempting Groq model:", candidate);
        completion = await groq.chat.completions.create({
          model: candidate,
          max_tokens: 150,
          messages: [{ role: "user", content: prompt }],
        });
        // if we got a response, stop trying further models
        if (completion) break;
      } catch (err) {
        lastError = err;
        // if error indicates model decommissioned, try next candidate
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.warn("[FarmCast] Groq model", candidate, "failed:", msg);
        // continue to next candidate
      }
    }

    if (!completion) {
      // all attempts failed
      // eslint-disable-next-line no-console
      console.error("[FarmCast] All Groq model attempts failed:", lastError);
      return risk.reason;
    }

    const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
    // eslint-disable-next-line no-console
    console.log("[FarmCast] Groq advice for", cropType, ":", text.substring(0, 80));
    return text.length > 0 ? text : risk.reason;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Groq crop advice failed:", error instanceof Error ? error.message : error);
    return risk.reason;
  }
}

