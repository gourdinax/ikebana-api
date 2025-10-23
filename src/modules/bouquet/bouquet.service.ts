import Bouquet from "./bouquet.model.js";
import type { IBouquet } from "./bouquet.model.js";

type ListParams = {
  q?: string;
  active?: boolean;
  categories?: string[];
  tags?: string[];
  sort?: "-created_at" | "created_at" | "name" | "-name" | "price" | "-price";
  page?: number;
  limit?: number;
};

export async function listBouquets(params: ListParams) {
  const {
    q,
    active,
    categories,
    tags,
    sort = "-created_at",
    page = 1,
    limit = 20
  } = params;

  const filter: any = {};
  if (typeof active === "boolean") filter.active = active;
  if (categories?.length) filter.categories = { $in: categories };
  if (tags?.length) filter.tags = { $in: tags };
  if (q) filter.$text = { $search: q };

  // Map tri à des champs réels
  const sortMap: Record<string, any> = {
    "-created_at": { created_at: -1 },
    "created_at": { created_at: 1 },
    "name": { name: 1 },
    "-name": { name: -1 },
    "price": { base_price: 1 },
    "-price": { base_price: -1 }
  };

  const cursor = Bouquet.find(filter)
    .sort(sortMap[sort] ?? sortMap["-created_at"])
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([
    cursor.lean(),
    Bouquet.countDocuments(filter)
  ]);

  return {
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getBouquetById(id: string) {
  return Bouquet.findById(id);
}

export async function createBouquet(data: Partial<IBouquet>) {
  return Bouquet.create(data);
}

export async function updateBouquet(id: string, patch: Partial<IBouquet>) {
  return Bouquet.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
}

export async function removeBouquet(id: string) {
  return Bouquet.findByIdAndDelete(id);
}
