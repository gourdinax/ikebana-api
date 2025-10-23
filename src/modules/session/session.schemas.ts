import { z } from "zod";

export const CreateSessionSchema = z.object({
  workshop_id: z.string().min(1),
  starts_at: z.coerce.date(),
  ends_at: z.coerce.date(),
  venue_id: z.string().min(1).optional(),
  capacity_max: z.number().int().positive(),
  status: z.enum(["open", "full", "cancelled"]).optional()
}).refine(d => d.ends_at > d.starts_at, { message: "ends_at doit être après starts_at", path: ["ends_at"] });

export const UpdateSessionSchema = z.object({
  starts_at: z.coerce.date().optional(),
  ends_at: z.coerce.date().optional(),
  venue_id: z.string().min(1).optional(),
  capacity_max: z.number().int().positive().optional(),
  status: z.enum(["open", "full", "cancelled"]).optional()
}).refine(d => {
  if (d.starts_at && d.ends_at) return d.ends_at > d.starts_at;
  return true;
}, { message: "ends_at doit être après starts_at", path: ["ends_at"] })
.refine(d => Object.keys(d).length > 0, { message: "Aucun champ à mettre à jour" });

export const ListQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  workshop_id: z.string().optional(),
  status: z.enum(["open", "full", "cancelled"]).optional(),
  sort: z.enum(["starts_at", "-starts_at"]).default("starts_at").optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional()
});
