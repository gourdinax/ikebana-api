import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  listPublic,
  getOne,
  createOne,
  updateOne,
  destroyOne,
  attachImage,
  listImages,
  detachImage
} from "./bouquet.controller.js";

const router = Router();

/**
 * Public
 */
router.get("/", listPublic);
router.get("/:id", getOne);

// Admin
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

router.post("/", auth(), requireAdmin, createOne);
router.patch("/:id", auth(), requireAdmin, updateOne);
router.delete("/:id", auth(), requireAdmin, destroyOne);

// --- IMAGES (Admin) ---
router.get("/:id/images", listImages); // tu peux mettre auth()+requireAdmin si tu veux
router.post("/:id/images", auth(), requireAdmin, attachImage);
router.delete("/:id/images/:fileId", auth(), requireAdmin, detachImage);

export default router;
