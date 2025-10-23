import Venue from "./venue.model.js";
import type { IVenue } from "./venue.model.js";

type ListParams = {
  q?: string;
  city?: string;
  sort?: "-created_at" | "created_at" | "name" | "-name";
  page?: number;
  limit?: number;
};

export async function listVenues(params: ListParams) {
  const { q, city, sort = "-created_at", page = 1, limit = 20 } = params;

  const filter: any = {};
  if (q) filter.name = { $regex: q, $options: "i" };
  if (city) filter["address.city"] = { $regex: `^${city}$`, $options: "i" };

  const sortMap: Record<string, any> = {
    "-created_at": { created_at: -1 },
    "created_at": { created_at: 1 },
    "name": { name: 1 },
    "-name": { name: -1 }
  };

  const cursor = Venue.find(filter)
    .sort(sortMap[sort] ?? sortMap["-created_at"])
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([cursor.lean(), Venue.countDocuments(filter)]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getVenueById(id: string) {
  return Venue.findById(id);
}

export async function createVenue(data: Partial<IVenue>) {
  return Venue.create(data);
}

export async function updateVenue(id: string, patch: Partial<IVenue>) {
  return Venue.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
}

export async function removeVenue(id: string) {
  return Venue.findByIdAndDelete(id);
}
