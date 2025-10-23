import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  CreateAddressSchema,
  UpdateAddressSchema
} from "./address.schemas.js";
import {
  listMyAddresses,
  createAddress,
  updateAddress,
  removeAddress,
  getMyAddressById,
  setDefault
} from "./address.service.js";

export async function listMine(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const items = await listMyAddresses(userId);
  res.json(items);
}

export async function getOne(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const item = await getMyAddressById(userId, req.params.id);
  if (!item) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(item);
}

export async function createOne(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub as string;
    const input = CreateAddressSchema.parse(req.body);
    const item = await createAddress(userId, input);
    res.status(201).json(item);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub as string;
    const input = UpdateAddressSchema.parse(req.body);
    const item = await updateAddress(userId, req.params.id, input as any);
    if (!item) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(item);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function destroyOne(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const item = await removeAddress(userId, req.params.id);
  if (!item) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}

export async function makeDefault(req: Request, res: Response) {
  const userId = (req as any).user?.sub as string;
  const item = await setDefault(userId, req.params.id);
  if (!item) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(item);
}
