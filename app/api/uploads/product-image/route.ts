import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { saveUploadedFile } from "@/lib/file-storage";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("products", "update");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }

  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return NextResponse.json({ message: "Nur Bilddateien sind erlaubt." }, { status: 400 });
  }
  try {
    return NextResponse.json(await saveUploadedFile(file, {
      folder: "products",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE
    }));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: 400 });
  }
}
