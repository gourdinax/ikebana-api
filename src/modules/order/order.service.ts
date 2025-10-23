import Order from "./order.model.js";
import type { IOrder, OrderStatus } from "./order.model.js";
import Bouquet from "../bouquet/bouquet.model.js";
import Address from "../address/address.model.js";
import { Types } from "mongoose";

const DEFAULT_VAT_RATE = 0.2; // 20% — ajuste selon ton besoin ou mets ça en env

function computeTotals(lines: { qty: number; unit_price_ttc: number }[], shipping = 0, vatRate = DEFAULT_VAT_RATE) {
  const subtotalTTC = lines.reduce((sum, l) => sum + l.qty * l.unit_price_ttc, 0);
  const ttc = subtotalTTC + shipping;
  const ht = ttc / (1 + vatRate);
  const tva = ttc - ht;
  return {
    ht: Math.round(ht * 100) / 100,
    tva: Math.round(tva * 100) / 100,
    ttc: Math.round(ttc * 100) / 100,
    shipping
  };
}

async function resolveLineSnapshots(inputLines: any[]) {
  // Retourne des lignes avec name + unit_price_ttc si absent
  const bouquetIds = [...new Set(inputLines.map((l) => l.bouquet_id).filter(Boolean))];
  const bouquets = await Bouquet.find({ _id: { $in: bouquetIds } }).lean();

  const byId = new Map(bouquets.map((b) => [String(b._id), b]));

  const resolved = inputLines.map((l) => {
    const b = byId.get(String(l.bouquet_id));
    if (!b) throw new Error("BOUQUET_NOT_FOUND");

    // Déterminer le prix unitaire: variante > base
    let unit = l.unit_price_ttc;
    if (unit == null) {
      if (l.variant_code && Array.isArray(b.variants)) {
        const found = b.variants.find((v: any) => v.code === l.variant_code);
        unit = found?.price ?? b.base_price;
      } else {
        unit = b.base_price;
      }
    }

    // Nom affiché = snapshot
    const name = l.name ?? b.name;

    return {
      bouquet_id: l.bouquet_id,
      variant_code: l.variant_code,
      qty: l.qty,
      unit_price_ttc: unit,
      discount_applied: l.discount_applied ?? 0,
      name
    };
  });

  return resolved;
}

async function resolveAddressSnapshotById(userId: string, addressId?: string) {
  if (!addressId) return undefined;
  if (!Types.ObjectId.isValid(addressId)) throw new Error("ADDRESS_NOT_FOUND");
  const addr = await Address.findOne({ _id: addressId, user_id: userId }).lean();
  if (!addr) throw new Error("ADDRESS_NOT_FOUND");
  return {
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    zip: addr.zip,
    country: addr.country
  };
}

export async function createOrder(userId: string, payload: {
  lines: any[];
  currency?: string;
  shipping_fee?: number;
  delivery_requested_at?: Date;
  card_message?: string;
  shipping_address_snapshot?: any;
  billing_address_snapshot?: any;
  shipping_address_id?: string;
  billing_address_id?: string;
}) {
  // 1) Résoudre snapshots de lignes (nom & prix)
  const lines = await resolveLineSnapshots(payload.lines);

  // 2) Résoudre snapshots d’adresses si pas fournis
  const shippingSnapshot =
    payload.shipping_address_snapshot ??
    (await resolveAddressSnapshotById(userId, payload.shipping_address_id));

  const billingSnapshot =
    payload.billing_address_snapshot ??
    (await resolveAddressSnapshotById(userId, payload.billing_address_id));

  // 3) Totaux
  const totals = computeTotals(lines, payload.shipping_fee ?? 0);

  // 4) Création
  const order = await Order.create({
    user_id: userId,
    status: "draft",
    currency: payload.currency ?? "EUR",
    totals,
    shipping_address_snapshot: shippingSnapshot,
    billing_address_snapshot: billingSnapshot,
    delivery_requested_at: payload.delivery_requested_at,
    card_message: payload.card_message,
    lines
  });

  return order;
}

export async function getMyOrders(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    Order.find({ user_id: userId }).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments({ user_id: userId })
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getMyOrderById(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Order.findOne({ _id: id, user_id: userId });
}

export async function adminListOrders(params: { page?: number; limit?: number; status?: string; user_id?: string }) {
  const { page = 1, limit = 20, status, user_id } = params;
  const filter: any = {};
  if (status) filter.status = status;
  if (user_id && Types.ObjectId.isValid(user_id)) filter.user_id = user_id;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter)
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function adminGetOrder(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Order.findById(id);
}

export async function adminUpdateStatus(id: string, status: OrderStatus) {
  if (!Types.ObjectId.isValid(id)) return null;
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    draft: ["paid", "cancelled"],
    paid: ["preparing", "cancelled"],
    preparing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: []
  };

  const order = await Order.findById(id);
  if (!order) return null;
  if (!allowed[order.status].includes(status)) {
    const err: any = new Error("INVALID_TRANSITION");
    err.code = "INVALID_TRANSITION";
    throw err;
  }

  order.status = status;

  // NB: décrément de stock -> à faire dans le module Payment quand on passe en "paid"
  // (ici on ne touche pas aux stocks)

  await order.save();
  return order;
}
