import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateBouquetSchema, UpdateBouquetSchema, ListQuerySchema } from "./bouquet.schemas.js";
import {
  listBouquets,
  getBouquetById,
  createBouquet,
  updateBouquet,
  removeBouquet
} from "./bouquet.service.js";

export async function listPublic(req: Request, res: Response) {
  try {
    const parsed = ListQuerySchema.parse(req.query);
    const categories = parsed.categories ? parsed.categories.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const tags = parsed.tags ? parsed.tags.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

    const result = await listBouquets({
      ...parsed,
      categories,
      tags
    });

    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function getOne(req: Request, res: Response) {
  const b = await getBouquetById(req.params.id);
  if (!b) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(b);
}

export async function createOne(req: Request, res: Response) {
  try {
    const input = CreateBouquetSchema.parse(req.body);
    const created = await createBouquet(input as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateBouquetSchema.parse(req.body);
    const updated = await updateBouquet(req.params.id, input as any);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function destroyOne(req: Request, res: Response) {
  const deleted = await removeBouquet(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}
