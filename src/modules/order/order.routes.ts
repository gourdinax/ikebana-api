import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  createOne,
  listMine,
  getMine,
  adminList,
  adminGet,
  adminUpdate
} from "./order.controller.js";

const router = Router();

// Utilisateur authentifié
router.use(auth());

// Créer une commande (draft)
router.post("/", createOne);

// Mes commandes
router.get("/me", listMine);
router.get("/me/:id", getMine);

// --- Admin only ---
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  next();
}

router.get("/", requireAdmin, adminList);
router.get("/:id", requireAdmin, adminGet);
router.patch("/:id/status", requireAdmin, adminUpdate);

export default router;
