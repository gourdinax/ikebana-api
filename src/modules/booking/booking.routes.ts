import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  createOne,
  listMine,
  getMine,
  adminList,
  adminUpdate
} from "./booking.controller.js";

const router = Router();

router.use(auth());

// Utilisateur
router.post("/", createOne);
router.get("/me", listMine);
router.get("/me/:id", getMine);

// Admin
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

router.get("/", requireAdmin, adminList);
router.patch("/:id/status", requireAdmin, adminUpdate);

export default router;
