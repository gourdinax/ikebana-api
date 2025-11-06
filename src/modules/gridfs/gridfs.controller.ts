// src/modules/gridfs/gridfs.controller.ts
import type { Request, Response } from "express";
import multer from "multer";
import { ZodError, z } from "zod";
import {
  uploadBufferToGridFS,
  listFiles,
  openDownloadStreamById,
  deleteFileById,
  findFileById,
} from "./gridfs.service.js";

/**
 * Multer in-memory storage (pas d'écriture disque local)
 * Limite de taille à ajuster selon le besoin (ici 5MB)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/** Middleware pour upload d'un seul fichier: champ "file" */
export const UploadOne = upload.single("file");

/** Body attendu à l'upload */
const UploadBodySchema = z.object({
  filename: z.string().min(1).optional(), // défaut = originalname
  entityKind: z.enum(["bouquet", "workshop", "session", "none"]).optional(),
  entityId: z.string().optional(),
});

/** Query de liste (avec filtres par metadata) */
const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  q: z.string().optional(),
  kind: z.enum(["bouquet", "workshop", "session", "none"]).optional(),
  entityId: z.string().optional(),
});

/**
 * POST /api/files
 * Form-data: file (File), filename?, entityKind?, entityId?
 * Nécessite auth + admin (voir routes)
 */
export async function uploadOne(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "NO_FILE", message: "Champ 'file' manquant (multipart/form-data)" });
    }

    const parsed = UploadBodySchema.parse(req.body ?? {});
    const filename = parsed.filename ?? req.file.originalname;
    const contentType = req.file.mimetype;
    const metadata = {
      ...(parsed.entityKind ? { entityKind: parsed.entityKind } : {}),
      ...(parsed.entityId ? { entityId: parsed.entityId } : {}),
      uploadedBy: (req as any).user?.sub ?? null,
    };

    const result = await uploadBufferToGridFS(
      req.file.buffer,
      filename,
      contentType,
      metadata
    );

    return res.status(201).json({
      _id: result._id,
      filename: result.filename,
      contentType,
      metadata,
    });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if (err?.message === "DB_NOT_CONNECTED") {
      return res
        .status(503)
        .json({ error: "SERVICE_UNAVAILABLE", message: "DB non connectée" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * GET /api/files
 * Query: page, limit, q, kind, entityId
 * Nécessite auth + admin (voir routes)
 */
export async function listAll(req: Request, res: Response) {
  try {
    const q = ListQuerySchema.parse(req.query);
    const data = await listFiles(q as any);
    res.json(data);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * GET /api/files/:id/meta
 * Métadonnées du fichier (auth + admin)
 */
export async function getMeta(req: Request, res: Response) {
  const file = await findFileById(req.params.id);
  if (!file) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(file);
}

/**
 * GET /api/files/:id
 * Stream inline (public par défaut, protège si besoin)
 */
export async function streamInline(req: Request, res: Response) {
  try {
    const meta = await findFileById(req.params.id);
    if (!meta) return res.status(404).json({ error: "NOT_FOUND" });

    if ((meta as any).contentType) {
      res.setHeader("Content-Type", (meta as any).contentType);
    }
    // Cache long pour les contenus statiques
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const stream = openDownloadStreamById(req.params.id);
    stream.on("error", () => res.status(404).end());
    stream.pipe(res);
  } catch (err: any) {
    if (err?.message === "INVALID_ID") {
      return res.status(400).json({ error: "INVALID_ID" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * GET /api/files/:id/download
 * Forcer le téléchargement (public par défaut, protège si besoin)
 */
export async function downloadAttachment(req: Request, res: Response) {
  try {
    const meta = await findFileById(req.params.id);
    if (!meta) return res.status(404).json({ error: "NOT_FOUND" });

    res.setHeader("Content-Disposition", `attachment; filename="${(meta as any).filename}"`);
    if ((meta as any).contentType) {
      res.setHeader("Content-Type", (meta as any).contentType);
    }

    const stream = openDownloadStreamById(req.params.id);
    stream.on("error", () => res.status(404).end());
    stream.pipe(res);
  } catch (err: any) {
    if (err?.message === "INVALID_ID") {
      return res.status(400).json({ error: "INVALID_ID" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * DELETE /api/files/:id
 * Nécessite auth + admin (voir routes)
 */
export async function destroyOne(req: Request, res: Response) {
  try {
    const ok = await deleteFileById(req.params.id);
    if (!ok) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(204).send();
  } catch (err: any) {
    if (err?.message === "INVALID_ID") {
      return res.status(400).json({ error: "INVALID_ID" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
