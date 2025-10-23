import { Schema, model, Types } from "mongoose";

export type SessionStatus = "open" | "full" | "cancelled";

const sessionSchema = new Schema(
  {
    workshop_id: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    starts_at: { type: Date, required: true, index: true },
    ends_at: { type: Date, required: true },
    venue_id: { type: Types.ObjectId, ref: "Venue" },
    capacity_max: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["open", "full", "cancelled"], default: "open", index: true },
    created_at: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

sessionSchema.index({ workshop_id: 1, starts_at: 1 });

export type ISession = {
  _id: string;
  workshop_id: Types.ObjectId;
  starts_at: Date;
  ends_at: Date;
  venue_id?: Types.ObjectId;
  capacity_max: number;
  status: SessionStatus;
  created_at: Date;
};

export default model<ISession>("Session", sessionSchema);
