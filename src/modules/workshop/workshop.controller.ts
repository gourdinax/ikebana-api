import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateWorkshopSchema, UpdateWorkshopSchema, ListQuerySchema } from "./workshop.schemas.js";
import {
  listWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  removeWorkshop
} from "./workshop.service.js";

export async function listPublic(req: Request, res: Response) {
  try {
    const parsed = ListQuerySchema.parse(req.query);
    const result = await listWorkshops(parsed as any);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function getOne(req: Request, res: Response) {
  const w = await getWorkshopById(req.params.id);
  if (!w) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(w);
}

export async function createOne(req: Request, res: Response) {
  try {
    const input = CreateWorkshopSchema.parse(req.body);
    const created = await createWorkshop(input as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateWorkshopSchema.parse(req.body);
    const updated = await updateWorkshop(req.params.id, input as any);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function destroyOne(req: Request, res: Response) {
  const deleted = await removeWorkshop(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}
