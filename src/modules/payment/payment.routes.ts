import express, { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { createIntent, webhook, listByOrder } from "./payment.controller.js";

const router = Router();

/**
 * ⚠️ Webhook Stripe : DOIT recevoir le body brut.
 * On fixe le parser uniquement pour cette route pour éviter de casser le reste de l'app.
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  // petit middleware pour exposer rawBody au controller
  (req, _res, next) => { (req as any).rawBody = req.body; next(); },
  webhook
);

// Routes protégées utilisateur
router.use(auth());

// Créer un PaymentIntent pour une commande (retourne client_secret)
router.post("/intent", createIntent);

// Lister les paiements d'une commande (owner/admin)
router.get("/order/:orderId", listByOrder);

export default router;
