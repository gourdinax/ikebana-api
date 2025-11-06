// src/modules/gridfs/gridfs.service.ts
import mongoose from "mongoose";
import { Readable } from "node:stream";
import type { ObjectId } from "mongoose";

export const BUCKET_NAME = "media"; // => collections: media.files & media.chunks

export function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB_NOT_CONNECTED");
  // @ts-ignore (type mongo export)
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export async function uploadBufferToGridFS(
  buffer: Buffer,
  filename: string,
  contentType?: string,
  metadata?: Record<string, any>
) {
  const bucket = getBucket();
  const stream = bucket.openUploadStream(filename, {
    contentType,
    metadata,
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer).pipe(stream)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  return {
    _id: stream.id as unknown as ObjectId,
    filename: stream.filename,
  };
}

export async function findFileById(id: string) {
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB_NOT_CONNECTED");
  const files = db.collection(`${BUCKET_NAME}.files`);
  const { ObjectId } = mongoose.Types;
  if (!ObjectId.isValid(id)) return null;
  return files.findOne({ _id: new ObjectId(id) });
}

export async function listFiles(params: { page?: number; limit?: number; q?: string; kind?: string; entityId?: string }) {
  const { page = 1, limit = 20, q, kind, entityId } = params;
  const db = mongoose.connection.db;
  if (!db) throw new Error("DB_NOT_CONNECTED");
  const files = db.collection(`${BUCKET_NAME}.files`);

  const filter: any = {};
  if (q) filter.filename = { $regex: q, $options: "i" };
  if (kind) filter["metadata.entityKind"] = kind;
  if (entityId) filter["metadata.entityId"] = entityId;

  const cursor = files
    .find(filter, { sort: { uploadDate: -1 } })
    .skip((page - 1) * limit)
    .limit(limit);

  const [items, total] = await Promise.all([cursor.toArray(), files.countDocuments(filter)]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}


export function openDownloadStreamById(id: string) {
  const { ObjectId } = mongoose.Types;
  if (!ObjectId.isValid(id)) throw new Error("INVALID_ID");
  const bucket = getBucket();
  return bucket.openDownloadStream(new ObjectId(id));
}

export async function deleteFileById(id: string) {
  const { ObjectId } = mongoose.Types;
  if (!ObjectId.isValid(id)) return false;
  const bucket = getBucket();
  await bucket.delete(new ObjectId(id));
  return true;
}
