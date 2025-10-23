import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  listMine,
  getOne,
  createOne,
  updateOne,
  destroyOne,
  makeDefault
} from "./address.controller.js";

const router = Router();

// Toutes ces routes nécessitent un utilisateur connecté
router.use(auth());

// GET /api/addresses/me -> liste mes adresses
router.get("/me", listMine);

// GET /api/addresses/:id -> détail (si m’appartient)
router.get("/:id", getOne);

// POST /api/addresses -> créer
router.post("/", createOne);

// PATCH /api/addresses/:id -> modifier
router.patch("/:id", updateOne);

// DELETE /api/addresses/:id -> supprimer
router.delete("/:id", destroyOne);

// POST /api/addresses/:id/default -> définir cette adresse par défaut (par type)
router.post("/:id/default", makeDefault);

export default router;
