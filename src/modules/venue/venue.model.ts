import { Schema, model } from "mongoose";

const venueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    address: {
      line1: { type: String, required: true, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, required: true, trim: true, index: true },
      zip: { type: String, required: true, trim: true },
      country: { type: String, default: "FR", trim: true }
    },
    access_info: { type: String, default: "" }, // digicode, étage, etc.
    geo: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false }
    },
    capacity: { type: Number, default: 20, min: 1 },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export type IVenue = {
  _id: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    zip: string;
    country: string;
  };
  access_info?: string;
  geo?: { lat?: number; lng?: number };
  capacity: number;
  created_at: Date;
};

export default model<IVenue>("Venue", venueSchema);
