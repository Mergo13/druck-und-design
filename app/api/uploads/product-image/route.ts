import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { saveUploadedFile } from "@/lib/file-storage";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".heic", ".heif", ".mp4", ".mov", ".webm"];
const MAX_FILE_SIZE = 80 * 1024 * 1024;

function extensionOf(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "update");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }

  const extension = extensionOf(file.name);
  const isHeicImage = extension === ".heic" || extension === ".heif";
  const isImage = (file.type.startsWith("image/") && file.type !== "image/svg+xml") || isHeicImage;
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ message: "Nur Bild- oder Videodateien sind erlaubt." }, { status: 400 });
  }
  try {
    return NextResponse.json(await saveUploadedFile(file, {
      folder: "products",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE,
      optimizeForWeb: true
    }));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: 400 });
  }
}
