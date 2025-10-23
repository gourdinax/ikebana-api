import { Schema, model, Types } from "mongoose";

const stockSchema = new Schema(
  {
    bouquet_id: { type: Types.ObjectId, ref: "Bouquet", required: true, index: true },
    variant_code: { type: String, required: true, trim: true, default: "BASE" },
    qty: { type: Number, default: 0, min: 0 },
    reorder_level: { type: Number, default: 0, min: 0 },
    updated_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Unicité: une ligne de stock par (bouquet, variante)
stockSchema.index({ bouquet_id: 1, variant_code: 1 }, { unique: true });

export type IStock = {
  _id: string;
  bouquet_id: Types.ObjectId;
  variant_code: string;
  qty: number;
  reorder_level: number;
  updated_at: Date;
};

export default model<IStock>("Stock", stockSchema);
