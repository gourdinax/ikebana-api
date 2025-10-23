import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { listPublic, getOne, getAvailability, createOne, updateOne, destroyOne } from "./session.controller.js";

const router = Router();

/** Public: lister et voir une session */
router.get("/", listPublic);
router.get("/:id", getOne);
router.get("/:id/availability", getAvailability);

/** Admin only */
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

router.post("/", auth(), requireAdmin, createOne);
router.patch("/:id", auth(), requireAdmin, updateOne);
router.delete("/:id", auth(), requireAdmin, destroyOne);

export default router;
