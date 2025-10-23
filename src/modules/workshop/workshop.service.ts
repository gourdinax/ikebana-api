import Workshop from "./workshop.model.js";
import type { IWorkshop } from "./workshop.model.js";

type ListParams = {
  q?: string;
  level?: "debutant" | "intermediaire" | "avance";
  active?: boolean;
  price_min?: number;
  price_max?: number;
  sort?: "-created_at" | "created_at" | "title" | "-title" | "price" | "-price";
  page?: number;
  limit?: number;
};

export async function listWorkshops(params: ListParams) {
  const {
    q,
    level,
    active,
    price_min,
    price_max,
    sort = "-created_at",
    page = 1,
    limit = 20
  } = params;

  const filter: any = {};
  if (q) filter.$text = { $search: q };
  if (level) filter.level = level;
  if (typeof active === "boolean") filter.active = active;
  if (price_min != null || price_max != null) {
    filter.price_ttc = {};
    if (price_min != null) filter.price_ttc.$gte = price_min;
    if (price_max != null) filter.price_ttc.$lte = price_max;
  }

  const sortMap: Record<string, any> = {
    "-created_at": { created_at: -1 },
    "created_at": { created_at: 1 },
    "title": { title: 1 },
    "-title": { title: -1 },
    "price": { price_ttc: 1 },
    "-price": { price_ttc: -1 }
  };

  const cursor = Workshop.find(filter)
    .sort(sortMap[sort] ?? sortMap["-created_at"])
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([cursor.lean(), Workshop.countDocuments(filter)]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getWorkshopById(id: string) {
  return Workshop.findById(id);
}

export async function createWorkshop(data: Partial<IWorkshop>) {
  return Workshop.create(data);
}

export async function updateWorkshop(id: string, patch: Partial<IWorkshop>) {
  return Workshop.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
}

export async function removeWorkshop(id: string) {
  return Workshop.findByIdAndDelete(id);
}
