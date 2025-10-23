import Stock from "./stock.model.js";
import type { IStock } from "./stock.model.js";
import { Types } from "mongoose";

export async function listByBouquet(bouquetId: string) {
  if (!Types.ObjectId.isValid(bouquetId)) return [];
  return Stock.find({ bouquet_id: bouquetId }).sort({ variant_code: 1 }).lean();
}

export async function getById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Stock.findById(id);
}

export async function createStock(data: Partial<IStock>) {
  const created = await Stock.create({
    bouquet_id: data.bouquet_id,
    variant_code: data.variant_code,
    qty: data.qty ?? 0,
    reorder_level: data.reorder_level ?? 0
  });
  return created;
}

export async function updateStock(id: string, patch: Partial<IStock>) {
  const updated = await Stock.findByIdAndUpdate(
    id,
    { $set: { ...patch, updated_at: new Date() } },
    { new: true, runValidators: true }
  );
  return updated;
}

export async function removeStock(id: string) {
  return Stock.findByIdAndDelete(id);
}

/**
 * Ajuste le stock de manière atomique.
 * @param id ligne de stock
 * @param delta entier (+ réception, - sortie)
 * @param forbidNegative si true, empêche de descendre sous 0
 */
export async function adjustStock(id: string, delta: number, forbidNegative = true) {
  if (!Types.ObjectId.isValid(id)) return null;

  if (forbidNegative) {
    const updated = await Stock.findOneAndUpdate(
      { _id: id, qty: { $gte: Math.max(0, -delta) } }, // si delta < 0, on exige qty >= |delta|
      { $inc: { qty: delta }, $set: { updated_at: new Date() } },
      { new: true }
    );
    return updated; // null si condition non satisfaite
  } else {
    const updated = await Stock.findByIdAndUpdate(
      id,
      { $inc: { qty: delta }, $set: { updated_at: new Date() } },
      { new: true }
    );
    return updated;
  }
}

/**
 * Utilitaire pour les commandes (quand on intégrera Orders):
 * décrémente via (bouquet_id, variant_code)
 */
export async function decrementByProductVariant(bouquetId: string, variantCode: string | undefined, qty: number) {
  const code = (variantCode && variantCode.trim()) ? variantCode : "BASE";
  const updated = await Stock.findOneAndUpdate(
    { bouquet_id: bouquetId, variant_code: code, qty: { $gte: qty } },
    { $inc: { qty: -qty }, $set: { updated_at: new Date() } },
    { new: true }
  );
  return updated; // null si stock insuffisant
}

