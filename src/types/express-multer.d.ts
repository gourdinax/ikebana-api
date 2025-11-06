// src/types/express-multer.d.ts
import "multer";

declare global {
  namespace Express {
    // Ajoute req.file (upload single) et req.files (upload multiple)
    interface Request {
      file?: Multer.File;
      files?: Record<string, Multer.File[]> | Multer.File[];
    }
  }
}

export {};
