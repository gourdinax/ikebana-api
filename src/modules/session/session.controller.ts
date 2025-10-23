import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateSessionSchema, UpdateSessionSchema, ListQuerySchema } from "./session.schemas.js";
import { createSession, updateSession, removeSession, getSessionById, listSessions, getRemainingSeats } from "./session.service.js";

export async function listPublic(req: Request, res: Response) {
  try {
    const parsed = ListQuerySchema.parse(req.query);
    const data = await listSessions(parsed as any);
    res.json(data);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function getOne(req: Request, res: Response) {
  const s = await getSessionById(req.params.id);
  if (!s) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(s);
}

export async function getAvailability(req: Request, res: Response) {
  const a = await getRemainingSeats(req.params.id);
  if (!a) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(a);
}

// --- Admin ---
export async function createOne(req: Request, res: Response) {
  try {
    const input = CreateSessionSchema.parse(req.body);
    const created = await createSession(input as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateSessionSchema.parse(req.body);
    const updated = await updateSession(req.params.id, input as any);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function destroyOne(req: Request, res: Response) {
  const deleted = await removeSession(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}
