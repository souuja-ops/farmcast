import { Router, type Request, type Response } from "express";
import FormData from "form-data";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../lib/firebase-admin";
import {
  analyzeTreeImage,
  fetchTreeQuota,
  WeatherAiApiError,
} from "../lib/weatherai";
import { verifyToken } from "../middleware/auth";
import { uploadSingle } from "../middleware/upload";

const router = Router();

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  cursor: z.string().optional(),
});

function handleRouteError(error: unknown, res: Response): void {
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
        : "Tree analysis service unavailable";
    const code =
      "code" in error && typeof error.code === "string"
        ? error.code
        : "TREE_ANALYSIS_ERROR";

    res.status(error.status).json({ error: message, code });
    return;
  }

  res.status(502).json({
    error:
      error instanceof Error
        ? error.message
        : "Tree analysis service unavailable",
    code: "TREE_ANALYSIS_ERROR",
  });

  // Log the original error for server-side debugging
  // (keeps response concise while surfacing the message)
  // eslint-disable-next-line no-console
  if (error instanceof Error) console.error("Route error:", error.stack ?? error.message);
}

router.post(
  "/analyze",
  verifyToken,
  uploadSingle,
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res
          .status(400)
          .json({ error: "Image file required", code: "NO_IMAGE" });
        return;
      }

      const fd = new FormData();
      fd.append("image", req.file.buffer, {
        filename: req.file.originalname || "image.jpg",
        contentType: req.file.mimetype,
        knownLength: req.file.buffer.length,
      });

      if (req.body.farmerId) {
        fd.append("farmerId", req.body.farmerId);
      }
      if (req.body.county) {
        fd.append("county", req.body.county);
      }
      if (req.body.landAcres) {
        fd.append("landAcres", req.body.landAcres);
      }
      if (req.body.location) {
        fd.append("location", req.body.location);
      }
      if (req.body.notes) {
        fd.append("notes", req.body.notes);
      }

      const analysisResult = await analyzeTreeImage(fd);

      try {
  const uid = req.user?.uid;
        if (!uid) {
          res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
          return;
        }

        await db.collection("analyses").add({
          uid,
          county: req.body.county ?? analysisResult.county,
          farmerId: req.body.farmerId ?? analysisResult.farmer_id,
          location: req.body.location ?? analysisResult.location,
          total_tree_count: analysisResult.total_tree_count,
          confidence_score: analysisResult.confidence_score,
          canopy_coverage_pct: analysisResult.canopy_coverage_pct,
          tree_density_per_acre: analysisResult.tree_density_per_acre ?? null,
          tree_species_guess: analysisResult.tree_species_guess,
          low_confidence: analysisResult.low_confidence,
          tree_health: analysisResult.tree_health,
          overlay_image_url: analysisResult.overlay_image_url,
          original_image_url: analysisResult.original_image_url,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (saveError) {
        console.warn(
          "Failed to save analysis to Firestore:",
          saveError instanceof Error ? saveError.message : "Unknown error",
        );
      }

      res.json({ data: analysisResult });
    } catch (error) {
      handleRouteError(error, res);
    }
  },
);

router.get("/history", verifyToken, async (req: Request, res: Response) => {
  try {
    const parsed = historyQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.errors[0]?.message ?? "Invalid query parameters",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    const { limit, cursor } = parsed.data;

  const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    let query = db
      .collection("analyses")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc");

    if (cursor) {
      const cursorDoc = await db.collection("analyses").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const pageDocs = hasMore
      ? snapshot.docs.slice(0, limit)
      : snapshot.docs;

    const analyses = pageDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const nextCursor = hasMore
      ? (pageDocs[pageDocs.length - 1]?.id ?? null)
      : null;

    res.json({ data: { analyses, nextCursor } });
  } catch (error) {
    handleRouteError(error, res);
  }
});

router.get("/quota", verifyToken, async (_req: Request, res: Response) => {
  try {
    const quota = await fetchTreeQuota();
    res.json({ data: quota });
  } catch (error) {
    handleRouteError(error, res);
  }
});

export default router;
