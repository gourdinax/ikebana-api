import { Schema, model, Types } from "mongoose";

export type OrderStatus =
  | "draft"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

const orderLineSchema = new Schema(
  {
    bouquet_id: { type: Types.ObjectId, ref: "Bouquet", required: true },
    variant_code: { type: String, required: false },
    name: { type: String, required: true }, // snapshot
    qty: { type: Number, required: true, min: 1 },
    unit_price_ttc: { type: Number, required: true, min: 0 },
    discount_applied: { type: Number, default: 0, min: 0 }
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "paid", "preparing", "shipped", "delivered", "cancelled"],
      default: "draft",
      index: true
    },
    currency: { type: String, default: "EUR" },
    totals: {
      ht: { type: Number, default: 0 },
      tva: { type: Number, default: 0 },
      ttc: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 }
    },
    shipping_address_snapshot: { type: Schema.Types.Mixed },
    billing_address_snapshot: { type: Schema.Types.Mixed },
    delivery_requested_at: { type: Date },
    card_message: { type: String },
    lines: { type: [orderLineSchema], validate: (v: any[]) => v?.length > 0 },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

orderSchema.index({ user_id: 1, created_at: -1 });

export type OrderLine = {
  _id: string;
  bouquet_id: Types.ObjectId;
  variant_code?: string;
  name: string;
  qty: number;
  unit_price_ttc: number;
  discount_applied?: number;
};

export type IOrder = {
  _id: string;
  user_id: Types.ObjectId;
  status: OrderStatus;
  currency: string;
  totals: { ht: number; tva: number; ttc: number; shipping: number };
  shipping_address_snapshot?: any;
  billing_address_snapshot?: any;
  delivery_requested_at?: Date;
  card_message?: string;
  lines: OrderLine[];
  created_at: Date;
};

export default model<IOrder>("Order", orderSchema);
