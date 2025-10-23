import { z } from "zod";

export const AddressTypeEnum = z.enum(["shipping", "billing"]);

export const CreateAddressSchema = z.object({
  type: AddressTypeEnum,
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  zip: z.string().min(2),
  country: z.string().default("FR").optional(),
  is_default: z.boolean().optional()
});

export const UpdateAddressSchema = z
  .object({
    line1: z.string().min(2).optional(),
    line2: z.string().optional(),
    city: z.string().min(1).optional(),
    zip: z.string().min(2).optional(),
    country: z.string().optional(),
    is_default: z.boolean().optional()
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Aucun champ à mettre à jour" });

export const SetDefaultSchema = z.object({
  // Si un jour tu veux “par type” dans le body, tu peux le permettre ici.
  // Pour ce module, on utilise le type de l’adresse ciblée.
});
