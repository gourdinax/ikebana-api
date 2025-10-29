import { z } from "zod";

export const BookingStatusEnum = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const CreateBookingSchema = z.object({
  session_id: z.string(),
  qty: z.number().int().positive(),
  total_ttc: z.number().positive().optional(),
  currency: z.string().default("eur").optional(),
});

export const UpdateBookingSchema = z
  .object({
    qty: z.number().int().positive().optional(),
    status: BookingStatusEnum.optional(),
    total_ttc: z.number().positive().optional(),
    currency: z.string().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: BookingStatusEnum.optional(),
});

/**
 * 🔐 Query ultra stricte pour /attendees
 * - onlyConfirmed: true par défaut
 * - expandSeats: false par défaut
 */
export const AttendeesQuerySchema = z.object({
  onlyConfirmed: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .default("true"),
  expandSeats: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .default("false"),
});
