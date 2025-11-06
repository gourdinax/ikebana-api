import type { Request, Response } from "express";
import Bouquet from "./bouquet.model.js";
import { ZodError, z } from "zod";
import { ListQuerySchema, CreateBouquetSchema, UpdateBouquetSchema } from "./bouquet.schemas.js";

// --- existants ---
export async function listPublic(req: Request, res: Response) {
  const q = ListQuerySchema.parse(req.query);
  const filter: any = {};
  if (q.q) filter.name = { $regex: q.q, $options: "i" };
  const page = q.page ?? 1;
  const limit = q.limit ?? 20;

  const cursor = Bouquet.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([cursor.lean(), Bouquet.countDocuments(filter)]);
  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}

export async function getOne(req: Request, res: Response) {
  const b = await Bouquet.findById(req.params.id).lean();
  if (!b) return res.status(404).json({ error: "NOT_FOUND" });
  res.json(b);
}

export async function createOne(req: Request, res: Response) {
  try {
    const input = CreateBouquetSchema.parse(req.body);
    const created = await Bouquet.create(input as any);
    res.status(201).json(created);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function updateOne(req: Request, res: Response) {
  try {
    const input = UpdateBouquetSchema.parse(req.body);
    const updated = await Bouquet.findByIdAndUpdate(req.params.id, { $set: input }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.json(updated);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

export async function destroyOne(req: Request, res: Response) {
  const deleted = await Bouquet.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}

// --- NOUVEAU: lier / lister / retirer images ---

const AttachImageSchema = z.object({
  file_id: z.string().min(1),
  alt: z.string().optional().default(""),
  sort: z.number().int().optional().default(0),
});

/** POST /api/bouquets/:id/images */
export async function attachImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const input = AttachImageSchema.parse(req.body);

    const updated = await Bouquet.findByIdAndUpdate(
      id,
      { $addToSet: { images: input } }, // évite duplicata exact
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
    res.status(201).json(updated.images);
  } catch (err) {
    if (err instanceof ZodError)
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.flatten() });
    res.status(500).json({ error: "INTERNAL_ERROR" });
  }
}

/** GET /api/bouquets/:id/images */
export async function listImages(req: Request, res: Response) {
  const b = await Bouquet.findById(req.params.id, { images: 1 }).lean();
  if (!b) return res.status(404).json({ error: "NOT_FOUND" });
  // tri côté API par sort puis insertion
  const images = [...(b.images ?? [])].sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
  res.json(images);
}

/** DELETE /api/bouquets/:id/images/:fileId */
export async function detachImage(req: Request, res: Response) {
  const { id, fileId } = req.params;
  const updated = await Bouquet.findByIdAndUpdate(
    id,
    { $pull: { images: { file_id: fileId } } },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ error: "NOT_FOUND" });
  res.status(204).send();
}
