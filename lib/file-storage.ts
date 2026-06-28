import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

type SaveFileOptions = {
  folder: "products" | "contact" | "print-check";
  allowedExtensions: readonly string[];
  maxBytes: number;
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getExtension(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

export async function saveUploadedFile(file: File, options: SaveFileOptions) {
  if (file.size <= 0 || file.size > options.maxBytes) {
    throw new Error(`Datei ist zu groß oder leer. Maximal ${Math.round(options.maxBytes / 1024 / 1024)} MB.`);
  }
  const extension = getExtension(file.name);
  if (!options.allowedExtensions.includes(extension)) {
    throw new Error("Dateityp nicht erlaubt.");
  }

  const safeName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFilename(file.name)}`;
  const useRemoteStorage = process.env.UPLOAD_STORAGE === "vercel-blob" || process.env.NODE_ENV === "production";

  if (useRemoteStorage) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN muss für Produktions-Uploads gesetzt sein.");
    }
    const blob = await put(`${options.folder}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
      token
    });
    return {
      url: blob.url,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream"
    };
  }

  const relativeDir = path.join("uploads", options.folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });
  await fs.writeFile(path.join(absoluteDir, safeName), Buffer.from(await file.arrayBuffer()));
  return {
    url: `/${relativeDir.replace(/\\/g, "/")}/${safeName}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream"
  };
}
