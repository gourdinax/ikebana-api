import mongoose, { Schema } from "mongoose";

const VariantSchema = new Schema(
  {
    code: { type: String, required: true },
    label: { type: String, default: "" },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const BouquetSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [] },
    // Images liées à GridFS
    images: {
      type: [
        {
          file_id: { type: String, required: true }, // id GridFS
          alt: { type: String, default: "" },
          sort: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    active: { type: Boolean, default: true },
    base_price: { type: Number, required: true },
    variants: { type: [VariantSchema], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

BouquetSchema.index({ name: 1 }, { unique: false });

export default mongoose.model("Bouquet", BouquetSchema);
