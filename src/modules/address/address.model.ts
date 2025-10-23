import { Schema, model, Types } from "mongoose";

const addressSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["shipping", "billing"], required: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, default: "FR", trim: true },
    is_default: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, versionKey: false }
);

// Par type, une seule adresse par défaut par utilisateur
addressSchema.index({ user_id: 1, type: 1, is_default: -1 });
export type IAddress = {
  _id: string;
  user_id: Types.ObjectId;
  type: "shipping" | "billing";
  line1: string;
  line2?: string;
  city: string;
  zip: string;
  country: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
};

export default model<IAddress>("Address", addressSchema);
