import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  listForBouquet,
  getOne,
  createOne,
  updateOne,
  destroyOne,
  adjustOne
} from "./stock.controller.js";

const router = Router();

// Lecture par bouquet (publique ou protégée selon ton besoin).
// Ici: on garde public pour permettre d'afficher la dispo (à affiner plus tard).
router.get("/by-bouquet/:bouquetId", listForBouquet);
router.get("/:id", getOne);

// Admin only
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "FORBIDDEN" });
  }
  next();
}

router.post("/", auth(), requireAdmin, createOne);
router.patch("/:id", auth(), requireAdmin, updateOne);
router.delete("/:id", auth(), requireAdmin, destroyOne);

// Ajustement atomique (réception/retour/rectif) : delta int (+/-)
router.post("/:id/adjust", auth(), requireAdmin, adjustOne);

export default router;
