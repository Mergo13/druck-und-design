import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { saveUploadedFile } from "@/lib/file-storage";
import { getCategories, getProducts, upsertCategory, upsertProduct } from "@/lib/catalog-repository";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".heic", ".heif", ".mp4", ".mov", ".webm"];
const MAX_FILE_SIZE = 80 * 1024 * 1024;

function extensionOf(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const form = await request.formData();
  const file = form.get("file");
  const targetType = String(form.get("targetType") ?? "").trim();
  const targetSlug = String(form.get("targetSlug") ?? "").trim();
  const imageRole = String(form.get("imageRole") ?? "").trim();

  const createPermission = await requireModulePermission("fileUploads", "create");
  if (!createPermission.ok) return NextResponse.json({ message: createPermission.message }, { status: createPermission.status });
  const shouldAssignImage = Boolean(targetType && targetSlug && imageRole);
  if (shouldAssignImage) {
    const updatePermission = await requireModulePermission("fileUploads", "update");
    if (!updatePermission.ok) return NextResponse.json({ message: updatePermission.message }, { status: updatePermission.status });
  }

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
    const uploaded = await saveUploadedFile(file, {
      folder: "products",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE,
      optimizeForWeb: true
    });

    if (shouldAssignImage && targetType === "product") {
      const product = (await getProducts()).find((item) => item.slug === targetSlug);
      if (!product) return NextResponse.json({ message: "Produkt nicht gefunden." }, { status: 404 });
      if (imageRole === "hero") {
        await upsertProduct({ ...product, heroImage: uploaded.url });
      } else if (imageRole === "gallery") {
        await upsertProduct({ ...product, gallery: Array.from(new Set([...(product.gallery ?? []), uploaded.url])) });
      }
    }

    if (shouldAssignImage && targetType === "category") {
      const category = (await getCategories()).find((item) => item.slug === targetSlug);
      if (!category) return NextResponse.json({ message: "Kategorie nicht gefunden." }, { status: 404 });
      await upsertCategory({ ...category, logo: uploaded.url });
    }

    return NextResponse.json(uploaded);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: 400 });
  }
}
