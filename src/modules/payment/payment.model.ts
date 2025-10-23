import { Schema, model, Types } from "mongoose";

export type PaymentStatus = "succeeded" | "pending" | "failed";

const paymentSchema = new Schema(
  {
    order_id: { type: Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, enum: ["stripe"], required: true, index: true },
    status: { type: String, enum: ["succeeded", "pending", "failed"], required: true, index: true },
    amount: { type: Number, required: true }, // en unité monétaire (ex: EUR, 110.00)
    currency: { type: String, default: "EUR" },
    tx_ref: { type: String, index: true }, // ex: pi_xxx (Stripe PaymentIntent id)
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Unicité par provider + tx_ref (si tx_ref est défini)
paymentSchema.index(
  { provider: 1, tx_ref: 1 },
  { unique: true, partialFilterExpression: { tx_ref: { $exists: true } } }
);

export type IPayment = {
  _id: string;
  order_id: Types.ObjectId;
  provider: "stripe";
  status: PaymentStatus;
  amount: number;
  currency: string;
  tx_ref?: string;
  created_at: Date;
};

export default model<IPayment>("Payment", paymentSchema);
