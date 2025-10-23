import { z } from "zod";

const OrderLineInput = z.object({
  bouquet_id: z.string().min(1),
  variant_code: z.string().optional(),
  qty: z.number().int().positive(),
  // optionnel: si le front veut forcer un prix unitaire (sinon on lit depuis le produit/variante)
  unit_price_ttc: z.number().nonnegative().optional(),
  name: z.string().min(1).optional() // snapshot (sinon on lit depuis le produit)
});

const AddressSnapshot = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  zip: z.string(),
  country: z.string()
});

export const CreateOrderSchema = z.object({
  lines: z.array(OrderLineInput).min(1),
  currency: z.string().default("EUR").optional(),
  shipping_fee: z.number().nonnegative().default(0).optional(),
  delivery_requested_at: z.coerce.date().optional(),
  card_message: z.string().max(500).optional(),
  // Soit fournir des snapshots directement, soit des IDs à prendre depuis Address
  shipping_address_snapshot: AddressSnapshot.optional(),
  billing_address_snapshot: AddressSnapshot.optional(),
  shipping_address_id: z.string().optional(),
  billing_address_id: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(["draft", "paid", "preparing", "shipped", "delivered", "cancelled"])
});

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.string().optional(),
  user_id: z.string().optional() // admin: filtrer par user
});
