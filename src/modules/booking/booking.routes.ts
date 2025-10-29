import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  listMine,
  getOne,
  createOne,
  updateOne,
  destroyOne,
  listAttendees
} from "./booking.controller.js";

const router = Router();

/**
 * Accès :
 * - /me : utilisateur connecté
 * - CRUD : selon ton design (généralement pas de delete côté client)
 * - /by-session/:sessionId/attendees : admin
 */

// Utilisateur connecté
router.get("/me", auth(), listMine);

// Lecture d'une réservation spécifique (admin ou propriétaire, selon ta logique d'auth dans controller/service)
router.get("/:id", auth(), getOne);

// Création (user)
router.post("/", auth(), createOne);

// Mise à jour (admin ou logique métier)
router.patch("/:id", auth(), updateOne);

// Suppression (admin)
router.delete("/:id", auth(), destroyOne);

// --- ADMIN ---
// Simple middleware admin local
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

/**
 * Liste des inscrits d'une session (via bookings)
 * GET /api/bookings/by-session/:sessionId/attendees
 * ?onlyConfirmed=true|false&expandSeats=true|false
 */
router.get("/by-session/:sessionId/attendees", auth(), requireAdmin, listAttendees);

export default router;
