import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  CreateBookingSchema,
  UpdateBookingSchema,
  ListQuerySchema
} from "./booking.schemas.js";
import {
  listMyBookings,
  getById,
  createBooking,
  updateBooking,
  removeBooking,
  listAttendeesBySession
} from "./booking.service.js";

/**
 * GET /api/bookings/me
 * Liste paginée des réservations de l'utilisateur connecté
 */
export async function listMine(req: Request, res: Response) {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const q = ListQuerySchema.parse(req.query);
    const data = await listMyBookings(userId, q as any);
    res.json(data);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * GET /api/bookings/:id
 */
export async function getOne(req: Request, res: Response) {
  const b = await getById(req.params.id);
  if (!b) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(b);
}

/**
 * POST /api/bookings
 */
export async function createOne(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

    const input = CreateBookingSchema.parse(req.body);
    const created = await createBooking({ ...input, user_id: userId });
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * PATCH /api/bookings/:id
 */
export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateBookingSchema.parse(req.body);
    const updated = await updateBooking(req.params.id, input as any);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/**
 * DELETE /api/bookings/:id
 */
export async function destroyOne(req: Request, res: Response) {
  const deleted = await removeBooking(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}

/**
 * GET /api/bookings/by-session/:sessionId/attendees  (admin)
 * Query: onlyConfirmed=true|false (default true), expandSeats=true|false (default false)
 */
export async function listAttendees(req: Request, res: Response) {
  const { sessionId } = req.params as any;
  const onlyConfirmed = req.query.onlyConfirmed !== "false"; // true par défaut
  const expandSeats = req.query.expandSeats === "true";       // false par défaut

  const items = await listAttendeesBySession(sessionId, {
    includePending: !onlyConfirmed,
    expandSeats
  });
  res.json({ items, count: items.length });
}
