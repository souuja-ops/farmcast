import { Router, type Request, type Response } from "express";
import { z } from "zod";
import {
  fetchUsage,
  fetchTreeQuota,
  fetchWeather,
  fetchWeatherByIp,
  WeatherAiApiError,
} from "../lib/weatherai";
import { verifyToken } from "../middleware/auth";
import { calculatePlantingRisk } from "../utils/plantingRisk";
import { getCropAdvice } from "../utils/cropAdvice";

const router = Router();

const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  days: z.coerce.number().min(1).max(7).default(7),
  lang: z.string().optional().default("en"),
  cropType: z.string().optional(),
});

function setRateLimitHeaders(
  res: Response,
  rateLimit: { remaining: number; reset: number },
): void {
  res.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
  res.set("X-RateLimit-Reset", rateLimit.reset.toString());
}

function handleRouteError(error: unknown, res: Response): void {
  // log full error for debugging in tests/dev
  // eslint-disable-next-line no-console
  console.error('weather route error:', error);
  if (error instanceof WeatherAiApiError) {
    const status = error.status > 0 ? error.status : 502;
    res.status(status).json({ error: error.message, code: error.code });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status > 0
  ) {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "Weather service unavailable";
    const code =
      "code" in error && typeof error.code === "string"
        ? error.code
        : "WEATHERAI_ERROR";

    res.status(error.status).json({ error: message, code });
    return;
  }

  res
    .status(502)
    .json({ error: "Weather service unavailable", code: "WEATHERAI_ERROR" });
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const parsed = weatherQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.errors[0]?.message ?? "Invalid query parameters",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const { lat, lon, days, lang, cropType } = parsed.data;
    const { data: weather, rateLimit } = await fetchWeather(
      lat,
      lon,
      days,
      lang,
      cropType,
    );
    const plantingRisk = calculatePlantingRisk(weather.daily);

    // generate short crop-specific advice using Gemini (or fallback to risk.reason)
    try {
      // FarmCast debug logs (temporary)
      // eslint-disable-next-line no-console
      console.log('[FarmCast] cropType from request:', cropType);
      // eslint-disable-next-line no-console
      console.log('[FarmCast] geminiApiKey configured:', !!require('../config').config.geminiApiKey);

      const cropReason = await getCropAdvice(
        cropType ?? "",
        plantingRisk,
        weather.daily,
        {
          lat: weather.location.lat,
          lon: weather.location.lon,
          country: weather.location.country,
        },
      );

      if (cropReason && typeof cropReason === "string") {
        weather.ai_summary = cropReason;
        // eslint-disable-next-line no-console
        console.log('[FarmCast] crop advice result:', cropReason.substring(0, 80));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('crop advice generation failed:', e);
    }

    setRateLimitHeaders(res, rateLimit);
    res.json({ data: { weather, plantingRisk } });
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.get("/geo", async (_req: Request, res: Response) => {
  try {
    const { data: weather, geo, rateLimit } = await fetchWeatherByIp();
    const plantingRisk = calculatePlantingRisk(weather.daily);

    setRateLimitHeaders(res, rateLimit);
    res.json({ data: { weather, geo, plantingRisk } });
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.get("/usage", verifyToken, async (_req: Request, res: Response) => {
  try {
    const [usage, treeQuota] = await Promise.all([
      fetchUsage(),
      fetchTreeQuota(),
    ]);

    res.json({ data: { usage, treeQuota } });
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
