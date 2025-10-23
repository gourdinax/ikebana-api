import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { listPublic, getOne, createOne, updateOne, destroyOne } from "./workshop.controller.js";

const router = Router();

/**
 * Public: catalogue d'ateliers
 */
router.get("/", listPublic);
router.get("/:id", getOne);

/**
 * Admin only pour le CRUD
 */
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

router.post("/", auth(), requireAdmin, createOne);
router.patch("/:id", auth(), requireAdmin, updateOne);
router.delete("/:id", auth(), requireAdmin, destroyOne);

export default router;
