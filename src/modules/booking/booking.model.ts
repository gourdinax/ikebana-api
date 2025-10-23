import { Schema, model, Types } from "mongoose";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

const bookingSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    session_id: { type: Types.ObjectId, ref: "Session", required: true, index: true },
    qty: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true
    },
    total_ttc: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    notes: { type: String },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

bookingSchema.index({ user_id: 1, session_id: 1 });

export type IBooking = {
  _id: string;
  user_id: Types.ObjectId;
  session_id: Types.ObjectId;
  qty: number;
  status: BookingStatus;
  total_ttc: number;
  currency: string;
  notes?: string;
  created_at: Date;
};

export default model<IBooking>("Booking", bookingSchema);
