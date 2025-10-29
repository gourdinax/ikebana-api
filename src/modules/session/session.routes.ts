import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  listPublic,
  getOne,
  createOne,
  updateOne,
  destroyOne,
  getAvailability
} from "./session.controller.js";
import { listAttendeesBySession } from "../booking/booking.service.js";
import { AttendeesQuerySchema } from "../booking/booking.schemas.js";

const router = Router();

/**
 * Public
 */
router.get("/", listPublic);
router.get("/:id", getOne);
router.get("/:id/availability", getAvailability);

/**
 * Admin only
 */
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

router.post("/", auth(), requireAdmin, createOne);
router.patch("/:id", auth(), requireAdmin, updateOne);
router.delete("/:id", auth(), requireAdmin, destroyOne);

/**
 * 🔐 Liste des inscrits d'une session (admin)
 * GET /api/sessions/:id/attendees
 * ?onlyConfirmed=true|false&expandSeats=true|false
 */
router.get("/:id/attendees", auth(), requireAdmin, async (req, res) => {
  try {
    // Validation stricte des query params
    const q = AttendeesQuerySchema.parse(req.query);
    const onlyConfirmed = q.onlyConfirmed !== "false"; // défaut true
    const expandSeats = q.expandSeats === "true";       // défaut false

    const items = await listAttendeesBySession(req.params.id, {
      includePending: !onlyConfirmed,
      expandSeats,
    });

    res.json({ items, count: items.length });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten?.() ?? String(err) });
    }
    console.error("attendees error:", err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

export default router;
