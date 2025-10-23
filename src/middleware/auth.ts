// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function auth(required = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.substring(7) : undefined;
    if (!token && required) return res.status(401).json({ error: "Unauthorized" });
    if (!token) return next();

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
      (req as any).user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}
