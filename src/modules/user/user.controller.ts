import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema
} from "./user.schemas.js";
import {
  createUser,
  authenticate,
  getByIdPublic,
  updateProfile,
  changePassword
} from "./user.service.js";

export async function register(req: Request, res: Response) {
  try {
    const input = RegisterSchema.parse(req.body);
    const user = await createUser(input);
    res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if (err instanceof Error && err.message === "EMAIL_ALREADY_USED") {
      return res.status(409).json({ error: "EMAIL_ALREADY_USED" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const input = LoginSchema.parse(req.body);
    const { user, token } = await authenticate(input.email, input.password);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if (err instanceof Error && err.message === "BAD_CREDENTIALS") {
      return res.status(401).json({ error: "BAD_CREDENTIALS" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const id = (req as any).user?.sub as string;
    const user = await getByIdPublic(id);
    res.json(user);
  } catch {
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateMe(req: Request, res: Response) {
  try {
    const id = (req as any).user?.sub as string;
    const input = UpdateProfileSchema.parse(req.body);
    const updated = await updateProfile(id, input);
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function changeMyPassword(req: Request, res: Response) {
  try {
    const id = (req as any).user?.sub as string;
    const input = ChangePasswordSchema.parse(req.body);
    await changePassword(id, input.current_password, input.new_password);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    }
    if (err instanceof Error && (err.message === "BAD_CREDENTIALS" || err.message === "NOT_FOUND")) {
      return res.status(401).json({ error: "BAD_CREDENTIALS" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}
