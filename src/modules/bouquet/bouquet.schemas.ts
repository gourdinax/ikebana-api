import { z } from "zod";

const VariantSchema = z.object({
  code: z.string().min(1),
  label: z.string().optional(),
  price: z.number().nonnegative()
});

export const CreateBouquetSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categories: z.array(z.string()).default([]).optional(),
  images: z.array(z.string().url()).default([]).optional(),
  active: z.boolean().default(true).optional(),
  base_price: z.number().nonnegative(),
  variants: z.array(VariantSchema).default([]).optional(),
  tags: z.array(z.string()).default([]).optional()
});

export const UpdateBouquetSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    active: z.boolean().optional(),
    base_price: z.number().nonnegative().optional(),
    variants: z.array(VariantSchema).optional(),
    tags: z.array(z.string()).optional()
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Aucun champ à mettre à jour" });

export const ListQuerySchema = z.object({
  q: z.string().optional(),
  active: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => (v === "true" ? true : false))
    .optional(),
  categories: z.string().optional(), // CSV
  tags: z.string().optional(), // CSV
  sort: z
    .enum(["-created_at", "created_at", "name", "-name", "price", "-price"])
    .default("-created_at")
    .optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional()
});
