import mongoose, { Schema, model } from "mongoose";

// ---------- Types TS exportés ----------
export type BouquetImage = {
  file_id: string;   // ID GridFS (string)
  alt?: string;
  sort?: number;
};

export type BouquetVariant = {
  code: string;
  label?: string;
  price: number;
};

export interface IBouquet {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  categories?: string[];
  images?: BouquetImage[];
  active: boolean;
  base_price: number;
  variants?: BouquetVariant[];
  tags?: string[];
  created_at?: Date;
  updated_at?: Date;
}

// ---------- Schémas Mongoose ----------
const VariantSchema = new Schema<BouquetVariant>(
  {
    code: { type: String, required: true },
    label: { type: String, default: "" },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ImageSchema = new Schema<BouquetImage>(
  {
    file_id: { type: String, required: true },
    alt: { type: String, default: "" },
    sort: { type: Number, default: 0 },
  },
  { _id: true }
);

const BouquetSchema = new Schema<IBouquet>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [] },
    images: { type: [ImageSchema], default: [] },
    active: { type: Boolean, default: true },
    base_price: { type: Number, required: true },
    variants: { type: [VariantSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

BouquetSchema.index({ name: 1 }, { unique: false });

// ---------- Export du modèle typé ----------
export default model<IBouquet>("Bouquet", BouquetSchema);
