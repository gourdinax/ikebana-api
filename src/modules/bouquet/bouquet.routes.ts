import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  listPublic,
  getOne,
  createOne,
  updateOne,
  destroyOne
} from "./bouquet.controller.js";

const router = Router();

/**
 * 💡 Stratégie d'accès :
 * - GET list/detail : public (ton front peut afficher le catalogue sans login).
 * - POST/PATCH/DELETE : réservé aux admins.
 */

router.get("/", listPublic);
router.get("/:id", getOne);

// Middleware simple pour restreindre aux admins
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  next();
}

router.post("/", auth(), requireAdmin, createOne);
router.patch("/:id", auth(), requireAdmin, updateOne);
router.delete("/:id", auth(), requireAdmin, destroyOne);

export default router;
