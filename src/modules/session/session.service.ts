import Session from "./session.model.js";
import type { ISession } from "./session.model.js";
import Booking from "../booking/booking.model.js";
import { Types, SortOrder } from "mongoose";

/**
 * Crée une nouvelle session (admin)
 */
export async function createSession(data: Partial<ISession>) {
  const created = await Session.create(data);
  return created;
}

/**
 * Met à jour une session (admin)
 */
export async function updateSession(id: string, patch: Partial<ISession>) {
  if (!Types.ObjectId.isValid(id)) return null;
  const updated = await Session.findByIdAndUpdate(
    id,
    { $set: patch },
    { new: true, runValidators: true }
  );
  return updated;
}

/**
 * Supprime une session (admin)
 */
export async function removeSession(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Session.findByIdAndDelete(id);
}

/**
 * Récupère une session par ID avec workshop et venue
 */
export async function getSessionById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Session.findById(id)
    .populate("workshop_id", "title price_ttc")
    .populate("venue_id", "name");
}

/**
 * Liste les sessions avec filtres dynamiques (public ou admin)
 */
type ListParams = {
  from?: Date;
  to?: Date;
  workshop_id?: string;
  status?: "open" | "full" | "cancelled";
  sort?: "starts_at" | "-starts_at";
  page?: number;
  limit?: number;
};

export async function listSessions(params: ListParams) {
  const {
    from,
    to,
    workshop_id,
    status,
    sort = "starts_at",
    page = 1,
    limit = 20
  } = params;

  const filter: any = {};

  // Filtre par période
  if (from || to) {
    filter.starts_at = {};
    if (from) filter.starts_at.$gte = from;
    if (to) filter.starts_at.$lte = to;
  }

  // Filtre par workshop
  if (workshop_id && Types.ObjectId.isValid(workshop_id)) {
    filter.workshop_id = workshop_id;
  }

  // Filtre par statut
  if (status) filter.status = status;

  // ✅ Tri typé
  const sortObj: Record<string, SortOrder> =
    sort === "-starts_at" ? { starts_at: -1 } : { starts_at: 1 };

  const cursor = Session.find(filter)
    .populate("workshop_id", "title price_ttc")
    .populate("venue_id", "name")
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([
    cursor.lean(),
    Session.countDocuments(filter)
  ]);

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

/**
 * Calcule les places restantes pour une session
 * (en comptant les réservations pending + confirmed)
 */
export async function getRemainingSeats(sessionId: string) {
  if (!Types.ObjectId.isValid(sessionId)) return null;

  const session = await Session.findById(sessionId).lean();
  if (!session) return null;

  const agg = await Booking.aggregate([
    {
      $match: {
        session_id: new Types.ObjectId(sessionId),
        status: { $in: ["pending", "confirmed"] }
      }
    },
    { $group: { _id: null, total: { $sum: "$qty" } } }
  ]);

  const taken = agg[0]?.total ?? 0;
  const remaining = Math.max(0, session.capacity_max - taken);

  return {
    session_id: sessionId,
    capacity_max: session.capacity_max,
    taken,
    remaining,
    status: session.status
  };
}
