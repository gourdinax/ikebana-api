import { Schema, model } from "mongoose";

export type WorkshopLevel = "debutant" | "intermediaire" | "avance";

const workshopSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    level: { type: String, enum: ["debutant", "intermediaire", "avance"], default: "debutant", index: true },
    duration_min: { type: Number, required: true, min: 15 },
    price_ttc: { type: Number, required: true, min: 0 },           // 💡 utilisé par booking
    default_capacity: { type: Number, required: true, min: 1, default: 10 },
    images: { type: [String], default: [] },
    materials_included: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true, index: true },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Recherche plein-texte simple
workshopSchema.index({ title: "text", description: "text", tags: "text" });

export type IWorkshop = {
  _id: string;
  title: string;
  description?: string;
  level: WorkshopLevel;
  duration_min: number;
  price_ttc: number;
  default_capacity: number;
  images: string[];
  materials_included: boolean;
  tags: string[];
  active: boolean;
  created_at: Date;
};

export default model<IWorkshop>("Workshop", workshopSchema);
