import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateVenueSchema, UpdateVenueSchema, ListQuerySchema } from "./venue.schemas.js";
import { listVenues, getVenueById, createVenue, updateVenue, removeVenue } from "./venue.service.js";

export async function listPublic(req: Request, res: Response) {
  try {
    const parsed = ListQuerySchema.parse(req.query);
    const result = await listVenues(parsed as any);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function getOne(req: Request, res: Response) {
  const v = await getVenueById(req.params.id);
  if (!v) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(v);
}

export async function createOne(req: Request, res: Response) {
  try {
    const input = CreateVenueSchema.parse(req.body);
    const created = await createVenue(input as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateVenueSchema.parse(req.body);
    const updated = await updateVenue(req.params.id, input as any);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function destroyOne(req: Request, res: Response) {
  const deleted = await removeVenue(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}
