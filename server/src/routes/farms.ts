import { Router, type Request, type Response } from "express";
import {
  FieldValue,
  type DocumentData,
  type Timestamp,
} from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../lib/firebase-admin";
import { verifyToken } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.use(verifyToken);

export interface Farm {
  id: string;
  name: string;
  lat: number;
  lon: number;
  cropType: string;
  createdAt: string;
}

const createFarmSchema = z.object({
  name: z.string().min(1).max(100),
  lat: z.number(),
  lon: z.number(),
  cropType: z.string().min(1).max(50),
});

const farmIdSchema = z.string().min(1);

function locationsCollection(uid: string) {
  return db.collection("farms").doc(uid).collection("locations");
}

function toFarm(id: string, data: DocumentData): Farm {
  const createdAt = data.createdAt as Timestamp | undefined;

  return {
    id,
    name: data.name as string,
    lat: data.lat as number,
    lon: data.lon as number,
    cropType: data.cropType as string,
    createdAt: createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
  const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const snapshot = await locationsCollection(uid)
      .orderBy("createdAt", "desc")
      .get();

    const farms: Farm[] = snapshot.docs.map((doc) => toFarm(doc.id, doc.data()));

    res.json({ data: farms });
  } catch (error) {
    console.error(
      "Failed to fetch farms:",
      error instanceof Error ? error.message : "Unknown error",
    );
    res.status(500).json({
      error: "Failed to fetch farms",
      code: "INTERNAL_ERROR",
    });
  }
});

router.post("/", validate(createFarmSchema), async (req: Request, res: Response) => {
  try {
    const { name, lat, lon, cropType } = req.body as z.infer<
      typeof createFarmSchema
    >;

  const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const docRef = await locationsCollection(uid).add({
      name,
      lat,
      lon,
      cropType,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      data: {
        id: docRef.id,
        name,
        lat,
        lon,
        cropType,
      },
    });
  } catch (error) {
    console.error(
      "Failed to create farm:",
      error instanceof Error ? error.message : "Unknown error",
    );
    res.status(500).json({
      error: "Failed to create farm",
      code: "INTERNAL_ERROR",
    });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const parsed = farmIdSchema.safeParse(req.params.id);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid farm id",
        code: "VALIDATION_ERROR",
      });
      return;
    }

  const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }

    const docRef = locationsCollection(uid).doc(parsed.data);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: "Farm not found", code: "NOT_FOUND" });
      return;
    }

    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error(
      "Failed to delete farm:",
      error instanceof Error ? error.message : "Unknown error",
    );
    res.status(500).json({
      error: "Failed to delete farm",
      code: "INTERNAL_ERROR",
    });
  }
});

export default router;
