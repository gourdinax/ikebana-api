import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  CreateStockSchema,
  UpdateStockSchema,
  AdjustSchema
} from "./stock.schemas.js";
import {
  listByBouquet,
  getById,
  createStock,
  updateStock,
  removeStock,
  adjustStock
} from "./stock.service.js";

export async function listForBouquet(req: Request, res: Response) {
  const { bouquetId } = req.params as any;
  const items = await listByBouquet(bouquetId);
  return res.json(items);
}

export async function getOne(req: Request, res: Response) {
  const item = await getById(req.params.id);
  if (!item) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(item);
}

export async function createOne(req: Request, res: Response) {
  try {
    const input = CreateStockSchema.parse(req.body);
    const created = await createStock(input as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if ((err as any)?.code === 11000) {
      return res.status(409).json({ error: "DUPLICATE", message: "Stock déjà existant pour ce bouquet/variante" });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateStockSchema.parse(req.body);
    const updated = await updateStock(req.params.id, input as any);
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
  const deleted = await removeStock(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}

export async function adjustOne(req: Request, res: Response) {
  try {
    const input = AdjustSchema.parse(req.body);
    const updated = await adjustStock(req.params.id, input.delta, input.forbid_negative ?? true);
    if (!updated) return res.status(409).json({ error: "INSUFFICIENT_STOCK_OR_NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
