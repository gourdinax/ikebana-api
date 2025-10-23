import { z } from "zod";

export const CreateIntentSchema = z.object({
  order_id: z.string().min(1)
});

export const ListByOrderSchema = z.object({
  orderId: z.string().min(1)
});
