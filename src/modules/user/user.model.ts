import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    password_hash: { type: String, required: true },
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["client", "admin"], default: "client", index: true },
    created_at: { type: Date, default: Date.now },
    last_login_at: { type: Date }
  },
  {
    versionKey: false
  }
);

export type IUser = {
  _id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: "client" | "admin";
  created_at: Date;
  last_login_at?: Date;
};

export default model<IUser>("User", userSchema);
