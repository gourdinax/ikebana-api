import Booking from "./booking.model.js";
import Session from "../session/session.model.js";
import Workshop from "../workshop/workshop.model.js";
import { Types } from "mongoose";

export async function createBooking(userId: string, sessionId: string, qty: number, notes?: string) {
  if (!Types.ObjectId.isValid(sessionId)) throw new Error("SESSION_NOT_FOUND");

  // Récupérer la session et l’atelier
  const session = await Session.findById(sessionId).populate("workshop_id");
  if (!session) throw new Error("SESSION_NOT_FOUND");

  const workshop = session.workshop_id as any;
  if (!workshop) throw new Error("WORKSHOP_NOT_FOUND");

  // Vérifier la capacité
  const totalBooked = await Booking.aggregate([
    { $match: { session_id: session._id, status: { $in: ["pending", "confirmed"] } } },
    { $group: { _id: null, total: { $sum: "$qty" } } }
  ]);

  const taken = totalBooked[0]?.total ?? 0;
  const remaining = session.capacity_max - taken;
  if (remaining < qty) throw new Error("INSUFFICIENT_SEATS");

  // Calcul du prix total TTC
  const priceTtc = workshop.price_ttc ?? 0;
  const total = qty * priceTtc;

  // Création
  const booking = await Booking.create({
    user_id: userId,
    session_id: session._id,
    qty,
    total_ttc: total,
    notes
  });

  return booking;
}

export async function listMyBookings(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    Booking.find({ user_id: userId })
      .populate({
        path: "session_id",
        populate: { path: "workshop_id", select: "title" }
      })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments({ user_id: userId })
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getMyBooking(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Booking.findOne({ _id: id, user_id: userId }).populate({
    path: "session_id",
    populate: { path: "workshop_id" }
  });
}

export async function adminListBookings(params: { page?: number; limit?: number; status?: string }) {
  const { page = 1, limit = 20, status } = params;
  const filter: any = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate({
        path: "session_id",
        populate: { path: "workshop_id" }
      })
      .populate("user_id", "email first_name last_name")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function adminUpdateStatus(id: string, status: string) {
  const updated = await Booking.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  return updated;
}
