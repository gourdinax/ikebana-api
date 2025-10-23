import { z } from "zod";

export const CreateWorkshopSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  level: z.enum(["debutant", "intermediaire", "avance"]).default("debutant").optional(),
  duration_min: z.number().int().positive().min(15),
  price_ttc: z.number().nonnegative(),
  default_capacity: z.number().int().positive().default(10).optional(),
  images: z.array(z.string().url()).default([]).optional(),
  materials_included: z.boolean().default(true).optional(),
  tags: z.array(z.string()).default([]).optional(),
  active: z.boolean().default(true).optional()
});

export const UpdateWorkshopSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
    duration_min: z.number().int().positive().min(15).optional(),
    price_ttc: z.number().nonnegative().optional(),
    default_capacity: z.number().int().positive().optional(),
    images: z.array(z.string().url()).optional(),
    materials_included: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    active: z.boolean().optional()
  })
  .refine(d => Object.keys(d).length > 0, { message: "Aucun champ à mettre à jour" });

export const ListQuerySchema = z.object({
  q: z.string().optional(),
  level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
  active: z
    .union([z.literal("true"), z.literal("false")])
    .transform(v => (v === "true" ? true : false))
    .optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["-created_at", "created_at", "title", "-title", "price", "-price"]).default("-created_at").optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional()
});
