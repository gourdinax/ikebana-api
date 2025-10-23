import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./user.model.js";
import { env } from "../../config/env.js";

type JWTPayload = { sub: string; role: string };

export async function createUser(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}) {
  const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
  if (existing) throw new Error("EMAIL_ALREADY_USED");

  const hash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    email: data.email.toLowerCase().trim(),
    password_hash: hash,
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone
  });

  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error("BAD_CREDENTIALS");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error("BAD_CREDENTIALS");

  // update last_login_at (non-bloquant)
  user.last_login_at = new Date();
  user.save().catch(() => {});

  const token = jwt.sign({ sub: String(user._id), role: user.role } as JWTPayload, env.JWT_SECRET, {
    expiresIn: "7d"
  });

  return { user, token };
}

export async function getByIdPublic(id: string) {
  return User.findById(id).select("-password_hash");
}

export async function updateProfile(id: string, data: { first_name?: string; last_name?: string; phone?: string }) {
  const updated = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true, fields: { password_hash: 0 } }
  );
  return updated;
}

export async function changePassword(id: string, current_password: string, new_password: string) {
  const user = await User.findById(id);
  if (!user) throw new Error("NOT_FOUND");

  const ok = await bcrypt.compare(current_password, user.password_hash);
  if (!ok) throw new Error("BAD_CREDENTIALS");

  const newHash = await bcrypt.hash(new_password, 10);
  user.password_hash = newHash;
  await user.save();
}
