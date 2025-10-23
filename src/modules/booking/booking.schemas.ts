import { z } from "zod";

export const CreateBookingSchema = z.object({
  session_id: z.string().min(1),
  qty: z.number().int().positive(),
  notes: z.string().max(500).optional()
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"])
});

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.string().optional()
});
