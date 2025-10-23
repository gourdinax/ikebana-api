import { z } from "zod";

const AddressSchema = z.object({
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  zip: z.string().min(2),
  country: z.string().default("FR").optional()
});

const GeoSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional()
}).optional();

export const CreateVenueSchema = z.object({
  name: z.string().min(2),
  address: AddressSchema,
  access_info: z.string().optional(),
  geo: GeoSchema,
  capacity: z.number().int().positive().default(20).optional()
});

export const UpdateVenueSchema = z.object({
  name: z.string().min(2).optional(),
  address: AddressSchema.partial().optional(),
  access_info: z.string().optional(),
  geo: GeoSchema,
  capacity: z.number().int().positive().optional()
}).refine(d => Object.keys(d).length > 0, { message: "Aucun champ à mettre à jour" });

export const ListQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  sort: z.enum(["-created_at", "created_at", "name", "-name"]).default("-created_at").optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional()
});
