import Address from "./address.model.js";
import type { IAddress } from "./address.model.js";
import { Types } from "mongoose";

export async function listMyAddresses(userId: string) {
  return Address.find({ user_id: userId }).sort({ type: 1, is_default: -1, created_at: -1 });
}

export async function getMyAddressById(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Address.findOne({ _id: id, user_id: userId });
}

export async function createAddress(userId: string, data: Partial<IAddress>) {
  const created = await Address.create({ ...data, user_id: userId });
  // Si marqué default, on unset les autres pour ce type
  if (created.is_default) {
    await Address.updateMany(
      { user_id: userId, type: created.type, _id: { $ne: created._id } },
      { $set: { is_default: false } }
    );
  }
  return created;
}

export async function updateAddress(userId: string, id: string, patch: Partial<IAddress>) {
  const addr = await getMyAddressById(userId, id);
  if (!addr) return null;

  const prevType = addr.type;
  Object.assign(addr, patch);
  await addr.save();

  // Si on vient de mettre is_default à true, unset les autres (par type de l’adresse)
  if (patch.is_default === true) {
    await Address.updateMany(
      { user_id: userId, type: addr.type, _id: { $ne: addr._id } },
      { $set: { is_default: false } }
    );
  }

  // Si le type a changé et que l'ancienne default était unique, on ne touche pas (le besoin métier décidera).
  return addr;
}

export async function removeAddress(userId: string, id: string) {
  const addr = await getMyAddressById(userId, id);
  if (!addr) return null;
  await Address.deleteOne({ _id: addr._id, user_id: userId });
  return addr;
}

export async function setDefault(userId: string, id: string) {
  const addr = await getMyAddressById(userId, id);
  if (!addr) return null;

  await Address.updateMany(
    { user_id: userId, type: addr.type, _id: { $ne: addr._id } },
    { $set: { is_default: false } }
  );
  addr.is_default = true;
  await addr.save();
  return addr;
}
