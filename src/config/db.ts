import mongoose from "mongoose";
import { env } from "./env.js";
export const connectDB = async () => {
  await mongoose.connect(env.MONGODB_URI);
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));
};
