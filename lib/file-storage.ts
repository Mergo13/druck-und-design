import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

type SaveFileOptions = {
  folder: "products" | "contact" | "print-check" | "site-images" | "industries";
  allowedExtensions: readonly string[];
  maxBytes: number;
  optimizeForWeb?: boolean;
  filenameBase?: string;
  preserveOriginalName?: boolean;
};

type PreparedUpload = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  originalSize: number;
  optimized: boolean;
  originalName: string;
};

const execFileAsync = promisify(execFile);

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sanitizeFilenameBase(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getExtension(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

function filenameWithoutExtension(name: string) {
  const safe = sanitizeFilename(name);
  const extension = getExtension(safe);
  return extension ? safe.slice(0, -extension.length) : safe;
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isImageExtension(extension: string) {
  return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".heic", ".heif", ".tif", ".tiff"].includes(extension);
}

function isVideoMime(mimeType: string) {
  return mimeType.startsWith("video/");
}

async function commandExists(command: string) {
  try {
    await execFileAsync("which", [command]);
    return true;
  } catch {
    return false;
  }
}

async function optimizeImage(file: File, input: Buffer): Promise<PreparedUpload> {
  const extension = getExtension(file.name);
  if (extension === ".gif" || extension === ".svg") {
    return {
      buffer: input,
      filename: `${filenameWithoutExtension(file.name)}${extension}`,
      mimeType: file.type || "application/octet-stream",
      originalSize: file.size,
      optimized: false,
      originalName: file.name
    };
  }

  try {
    const sharp = (await import("sharp")).default;
    const output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    return {
      buffer: output,
      filename: `${filenameWithoutExtension(file.name)}.webp`,
      mimeType: "image/webp",
      originalSize: file.size,
      optimized: output.length < input.length,
      originalName: file.name
    };
  } catch {
    return {
      buffer: input,
      filename: `${filenameWithoutExtension(file.name)}${extension}`,
      mimeType: file.type || "application/octet-stream",
      originalSize: file.size,
      optimized: false,
      originalName: file.name
    };
  }
}

async function optimizeVideo(file: File, input: Buffer): Promise<PreparedUpload> {
  const extension = getExtension(file.name);
  if (!(await commandExists("ffmpeg"))) {
    return {
      buffer: input,
      filename: `${filenameWithoutExtension(file.name)}${extension}`,
      mimeType: file.type || "application/octet-stream",
      originalSize: file.size,
      optimized: false,
      originalName: file.name
    };
  }

  const tempDir = path.join(process.cwd(), ".next", "upload-optimization");
  await fs.mkdir(tempDir, { recursive: true });
  const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const inputPath = path.join(tempDir, `${id}${extension || ".upload"}`);
  const outputPath = path.join(tempDir, `${id}.mp4`);
  try {
    await fs.writeFile(inputPath, input);
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-vf", "scale='min(1280,iw)':-2",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "28",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputPath
    ], { maxBuffer: 1024 * 1024 });
    const output = await fs.readFile(outputPath);
    return {
      buffer: output.length < input.length ? output : input,
      filename: `${filenameWithoutExtension(file.name)}${output.length < input.length ? ".mp4" : extension}`,
      mimeType: output.length < input.length ? "video/mp4" : (file.type || "application/octet-stream"),
      originalSize: file.size,
      optimized: output.length < input.length,
      originalName: file.name
    };
  } catch {
    return {
      buffer: input,
      filename: `${filenameWithoutExtension(file.name)}${extension}`,
      mimeType: file.type || "application/octet-stream",
      originalSize: file.size,
      optimized: false,
      originalName: file.name
    };
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => undefined),
      fs.unlink(outputPath).catch(() => undefined)
    ]);
  }
}

async function prepareUpload(file: File, optimizeForWeb: boolean): Promise<PreparedUpload> {
  const input = Buffer.from(await file.arrayBuffer());
  const extension = getExtension(file.name);
  if (!optimizeForWeb) {
    return {
      buffer: input,
      filename: sanitizeFilename(file.name),
      mimeType: file.type || "application/octet-stream",
      originalSize: file.size,
      optimized: false,
      originalName: file.name
    };
  }
  if (isImageMime(file.type) || isImageExtension(extension)) return optimizeImage(file, input);
  if (isVideoMime(file.type)) return optimizeVideo(file, input);
  return {
    buffer: input,
    filename: sanitizeFilename(file.name),
    mimeType: file.type || "application/octet-stream",
    originalSize: file.size,
    optimized: false,
    originalName: file.name
  };
}

async function unusedFilename(dir: string, filename: string) {
  const extension = getExtension(filename);
  const base = extension ? filename.slice(0, -extension.length) : filename;
  let candidate = filename;
  let index = 2;

  while (true) {
    try {
      await fs.access(path.join(dir, candidate));
      candidate = `${base}-${index}${extension}`;
      index += 1;
    } catch {
      return candidate;
    }
  }
}

export async function saveUploadedFile(file: File, options: SaveFileOptions) {
  if (file.size <= 0 || file.size > options.maxBytes) {
    throw new Error(`Datei ist zu groß oder leer. Maximal ${Math.round(options.maxBytes / 1024 / 1024)} MB.`);
  }
  const extension = getExtension(file.name);
  if (!options.allowedExtensions.includes(extension)) {
    throw new Error("Dateityp nicht erlaubt.");
  }

  const prepared = await prepareUpload(file, Boolean(options.optimizeForWeb));
  const preparedExtension = getExtension(prepared.filename);
  const preferredBase = options.filenameBase ? sanitizeFilenameBase(options.filenameBase) : "";
  const safeName = preferredBase
    ? `${preferredBase}${preparedExtension || extension}`
    : `${Date.now()}-${randomUUID().slice(0, 8)}-${prepared.filename}`;
  const storage = process.env.UPLOAD_STORAGE?.trim() || "local";
  if (storage !== "local") {
    throw new Error("UPLOAD_STORAGE muss auf 'local' gesetzt sein.");
  }

  const relativeDir = path.join("uploads", options.folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });
  const filename = options.preserveOriginalName ? await unusedFilename(absoluteDir, prepared.filename) : safeName;
  await fs.writeFile(path.join(absoluteDir, filename), prepared.buffer);
  return {
    url: `/${relativeDir.replace(/\\/g, "/")}/${filename}`,
    name: prepared.originalName,
    size: prepared.buffer.length,
    originalSize: prepared.originalSize,
    optimized: prepared.optimized,
    mimeType: prepared.mimeType
  };
}

export async function deleteManagedUploadedFile(url: string, allowedFolders: Array<SaveFileOptions["folder"]>) {
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\0") || trimmed.includes("..")) {
    return { deleted: false };
  }

  const normalizedAllowedPrefixes = allowedFolders.map((folder) => `/uploads/${folder}/`);
  if (!normalizedAllowedPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    return { deleted: false };
  }

  const absolutePath = path.resolve(process.cwd(), "public", trimmed.replace(/^\/+/, ""));
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return { deleted: false };
  }

  await fs.unlink(absolutePath).catch(() => undefined);
  return { deleted: true };
}
