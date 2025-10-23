import type { Request, Response, NextFunction } from "express";

/**
 * Middleware global de gestion des erreurs
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("❌ Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: err.code || "INTERNAL_ERROR",
    message
  });
}
