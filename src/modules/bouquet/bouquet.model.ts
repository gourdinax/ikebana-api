import { Schema, model } from "mongoose";

const variantSchema = new Schema(
  {
    code: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const bouquetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [] },
    images: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
    base_price: { type: Number, required: true, min: 0 },
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [] }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, versionKey: false }
);

// Indexs utiles
bouquetSchema.index({ name: "text", description: "text", tags: "text" });

export type Variant = { code: string; label?: string; price: number };
export type IBouquet = {
  _id: string;
  name: string;
  description?: string;
  categories: string[];
  images: string[];
  active: boolean;
  base_price: number;
  variants: Variant[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
};

export default model<IBouquet>("Bouquet", bouquetSchema);
