import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/firebase-admin";

export async function verifyToken(
  req: Request & { user?: { uid: string } },
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "No token provided", code: "UNAUTHORIZED" });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid };
    next();
  } catch {
    res
      .status(401)
      .json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
}
