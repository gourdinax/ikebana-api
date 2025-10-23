import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateOrderSchema, ListQuerySchema, UpdateStatusSchema } from "./order.schemas.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus
} from "./order.service.js";

export async function createOne(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub as string;
    const input = CreateOrderSchema.parse(req.body);
    const order = await createOrder(userId, input as any);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if (err instanceof Error && err.message === "BOUQUET_NOT_FOUND") {
      return res.status(404).json({ error: "BOUQUET_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "ADDRESS_NOT_FOUND") {
      return res.status(404).json({ error: "ADDRESS_NOT_FOUND" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function listMine(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub as string;
    const parsed = ListQuerySchema.parse(req.query);
    const result = await getMyOrders(userId, parsed.page, parsed.limit);
    res.json(result);
  } catch {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function getMine(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const order = await getMyOrderById(userId, req.params.id);
  if (!order) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(order);
}

// --- Admin ---

export async function adminList(req: Request, res: Response) {
  try {
    const parsed = ListQuerySchema.parse(req.query);
    const result = await adminListOrders({
      page: parsed.page,
      limit: parsed.limit,
      status: (req.query.status as string) || undefined,
      user_id: (req.query.user_id as string) || undefined
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function adminGet(req: Request, res: Response) {
  const order = await adminGetOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(order);
}

export async function adminUpdate(req: Request, res: Response) {
  try {
    const input = UpdateStatusSchema.parse(req.body);
    const updated = await adminUpdateStatus(req.params.id, input.status);
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if ((err as any)?.code === "INVALID_TRANSITION") {
      return res.status(400).json({ error: "INVALID_TRANSITION" });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
