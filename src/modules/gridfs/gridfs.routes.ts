// src/modules/gridfs/gridfs.routes.ts
import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import {
  UploadOne,
  uploadOne,
  listAll,
  getMeta,
  streamInline,
  downloadAttachment,
  destroyOne,
} from "./gridfs.controller.js";

const router = Router();

/**
 * Sécurité :
 * - Upload / Delete : réservé à l'admin
 * - Lecture / Stream : public (si tu veux protéger, ajoute auth() aussi ici)
 */

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

// 📥 Upload (multipart/form-data, champ "file")
router.post("/", auth(), requireAdmin, UploadOne, uploadOne);

// 🔎 Liste (paginée)
router.get("/", auth(), requireAdmin, listAll);

// 🧾 Métadonnées d’un fichier
router.get("/:id/meta", auth(), requireAdmin, getMeta);

// 🖼️ Stream inline (affichage dans le navigateur)
router.get("/:id", streamInline);

// ⬇️ Download (attachment)
router.get("/:id/download", downloadAttachment);

// 🗑️ Suppression
router.delete("/:id", auth(), requireAdmin, destroyOne);

export default router;
