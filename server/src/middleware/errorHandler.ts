import type { NextFunction, Request, Response } from "express";

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err.message);

  const statusCode = err.statusCode ?? err.status ?? 500;

  res.status(statusCode).json({
    error: err.message,
    code: err.code ?? "INTERNAL_ERROR",
  });
}
