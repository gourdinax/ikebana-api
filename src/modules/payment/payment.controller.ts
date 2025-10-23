import type { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateIntentSchema } from "./payment.schemas.js";
import { createStripeIntentForOrder, handleStripeWebhook, listPaymentsForOrder } from "./payment.service.js";

export async function createIntent(req: Request, res: Response) {
  try {
    const { order_id } = CreateIntentSchema.parse(req.body);
    const userId = (req as any).user?.sub as string;
    const result = await createStripeIntentForOrder(userId, order_id);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if (err instanceof Error && err.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ error: "ORDER_NOT_FOUND" });
    }
    if (err instanceof Error && err.message === "ORDER_NOT_DRAFT") {
      return res.status(400).json({ error: "ORDER_NOT_DRAFT" });
    }
    if (err instanceof Error && err.message === "INVALID_TOTAL") {
      return res.status(400).json({ error: "INVALID_TOTAL" });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

// Webhook: nécessite body brut (voir routes.ts)
export async function webhook(req: Request, res: Response) {
  try {
    const sig = req.headers["stripe-signature"] as string | undefined;
    const payload = (req as any).rawBody as Buffer; // injecté par express.raw dans la route
    const result = await handleStripeWebhook(payload, sig);
    return res.json(result);
  } catch (err) {
    const code = (err as any)?.code;
    if (code === "INVALID_SIGNATURE") {
      return res.status(400).send(`Webhook Error: invalid signature`);
    }
    return res.status(400).send(`Webhook Error`);
  }
}

export async function listByOrder(req: Request, res: Response) {
  try {
    const requester = { id: (req as any).user?.sub as string, role: (req as any).user?.role as string };
    const { orderId } = req.params;
    const items = await listPaymentsForOrder(requester, orderId);
    res.json(items);
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
