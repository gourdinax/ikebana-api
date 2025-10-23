import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateBookingSchema, UpdateBookingStatusSchema, ListQuerySchema } from "./booking.schemas.js";
import {
  createBooking,
  listMyBookings,
  getMyBooking,
  adminListBookings,
  adminUpdateStatus
} from "./booking.service.js";

export async function createOne(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub as string;
    const { session_id, qty, notes } = CreateBookingSchema.parse(req.body);
    const booking = await createBooking(userId, session_id, qty, notes);
    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });

    if (err instanceof Error && err.message === "SESSION_NOT_FOUND")
      return res.status(404).json({ error: "SESSION_NOT_FOUND" });

    if (err instanceof Error && err.message === "INSUFFICIENT_SEATS")
      return res.status(409).json({ error: "INSUFFICIENT_SEATS" });

    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function listMine(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const parsed = ListQuerySchema.parse(req.query);
  const result = await listMyBookings(userId, parsed.page, parsed.limit);
  res.json(result);
}

export async function getMine(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const booking = await getMyBooking(userId, req.params.id);
  if (!booking) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(booking);
}

export async function adminList(req: Request, res: Response) {
  const parsed = ListQuerySchema.parse(req.query);
  const result = await adminListBookings({ page: parsed.page, limit: parsed.limit, status: parsed.status });
  res.json(result);
}

export async function adminUpdate(req: Request, res: Response) {
  try {
    const { status } = UpdateBookingStatusSchema.parse(req.body);
    const updated = await adminUpdateStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
