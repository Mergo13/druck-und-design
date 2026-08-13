import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { saveUploadedFile } from "@/lib/file-storage";
import { siteImageSlots } from "@/lib/site-images";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".heic", ".heif"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function extensionOf(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("fileUploads", "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const form = await request.formData();
  const file = form.get("file");
  const slotKey = String(form.get("slotKey") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }
  if (!siteImageSlots.some((slot) => slot.key === slotKey)) {
    return NextResponse.json({ message: "Unbekannter Bild-Slot." }, { status: 400 });
  }

  const extension = extensionOf(file.name);
  const isHeicImage = extension === ".heic" || extension === ".heif";
  const isImage = (file.type.startsWith("image/") && file.type !== "image/svg+xml") || isHeicImage;
  if (!isImage) {
    return NextResponse.json({ message: "Nur Bilddateien sind erlaubt." }, { status: 400 });
  }

  try {
    return NextResponse.json(await saveUploadedFile(file, {
      folder: "site-images",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE,
      optimizeForWeb: true,
      filenameBase: slotKey
    }));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: 400 });
  }
}
