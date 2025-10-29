import { Types } from "mongoose";
import Booking from "./booking.model.js";

/**
 * Types utilitaires (facultatifs) pour plus de clarté
 */
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type ListParams = {
  userId?: string;
  status?: BookingStatus;
  page?: number;
  limit?: number;
};

export async function listMyBookings(userId: string, params: Omit<ListParams, "userId"> = {}) {
  const { status, page = 1, limit = 20 } = params;
  const filter: any = { user_id: userId };
  if (status) filter.status = status;

  const cursor = Booking.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([cursor.lean(), Booking.countDocuments(filter)]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getById(id: string) {
  return Booking.findById(id);
}

export async function createBooking(data: any) {
  // attente : { user_id, session_id, qty, price_ttc?, currency? ... }
  return Booking.create(data);
}

export async function updateBooking(id: string, patch: any) {
  return Booking.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
}

export async function removeBooking(id: string) {
  return Booking.findByIdAndDelete(id);
}

/**
 * Liste les inscrits d'une session (agrégation à la lecture)
 * - Par défaut : uniquement les bookings "confirmed"
 * - includePending = true : inclut aussi "pending"
 * - expandSeats = true : déplie une ligne par place (qty -> 1)
 */
export async function listAttendeesBySession(
  sessionId: string,
  options?: { includePending?: boolean; expandSeats?: boolean }
) {
  if (!Types.ObjectId.isValid(sessionId)) return [];

  const { includePending = false, expandSeats = false } = options ?? {};
  const statuses: BookingStatus[] = includePending ? ["confirmed", "pending"] : ["confirmed"];

  const pipeline = [
    { $match: { session_id: new Types.ObjectId(sessionId), status: { $in: statuses } } },
    // Regroupement par user_id pour sommer la qty
    { $group: { _id: "$user_id", qty: { $sum: "$qty" } } },
    // Récupération des infos user
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        user: {
          _id: "$user._id",
          first_name: "$user.first_name",
          last_name: "$user.last_name",
          email: "$user.email"
        },
        qty: 1
      }
    }
  ];

  const rows: Array<{ user: any; qty: number }> = await Booking.aggregate(pipeline);

  if (!expandSeats) return rows;

  // déplie en une ligne par place
  const expanded: Array<{ user: any; qty: number }> = [];
  for (const r of rows) {
    for (let i = 0; i < r.qty; i++) {
      expanded.push({ user: r.user, qty: 1 });
    }
  }
  return expanded;
}
