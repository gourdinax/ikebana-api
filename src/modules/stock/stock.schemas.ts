import { z } from "zod";

export const CreateStockSchema = z.object({
  bouquet_id: z.string().min(1),
  variant_code: z.string().min(1),
  qty: z.number().int().nonnegative().default(0).optional(),
  reorder_level: z.number().int().nonnegative().default(0).optional()
});

export const UpdateStockSchema = z
  .object({
    qty: z.number().int().nonnegative().optional(),
    reorder_level: z.number().int().nonnegative().optional()
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Aucun champ à mettre à jour" });

export const AdjustSchema = z.object({
  delta: z.number().int(), // positif (réception) ou négatif (sortie/vente)
  forbid_negative: z.boolean().default(true).optional()
});

export const ListByBouquetQuery = z.object({
  bouquetId: z.string().min(1)
});
