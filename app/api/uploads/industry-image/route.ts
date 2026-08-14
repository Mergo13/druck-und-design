import { NextResponse } from "next/server";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { requireModulePermission } from "@/lib/admin-permissions";
import { deleteManagedUploadedFile, saveUploadedFile } from "@/lib/file-storage";
import { getIndustryBySlug, upsertIndustry } from "@/lib/catalog-repository";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function extensionOf(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

function safeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("fileUploads", "create");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const form = await request.formData();
  const file = form.get("file");
  const industrySlug = safeSlug(String(form.get("industrySlug") ?? ""));
  const imageRole = safeSlug(String(form.get("imageRole") ?? ""));

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }
  if (!industrySlug || !imageRole) {
    return NextResponse.json({ message: "Branche und Bildtyp sind erforderlich." }, { status: 400 });
  }

  const extension = extensionOf(file.name);
  const isImage = file.type.startsWith("image/") && file.type !== "image/svg+xml";
  if (!isImage) {
    return NextResponse.json({ message: "Nur Bilddateien sind erlaubt." }, { status: 400 });
  }

  try {
    const updatePermission = await requireModulePermission("fileUploads", "update");
    if (!updatePermission.ok) return NextResponse.json({ message: updatePermission.message }, { status: updatePermission.status });

    const uploaded = await saveUploadedFile(file, {
      folder: "industries",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE,
      optimizeForWeb: true,
      preserveOriginalName: true
    });

    const industry = await getIndustryBySlug(industrySlug);
    if (!industry) return NextResponse.json({ message: "Branche nicht gefunden." }, { status: 404 });
    if (imageRole === "hero") {
      await upsertIndustry({ ...industry, heroImage: uploaded.url });
    } else if (imageRole.startsWith("showroom-")) {
      const index = Number(imageRole.replace("showroom-", "")) - 1;
      if (!Number.isInteger(index) || index < 0) {
        return NextResponse.json({ message: "Ungültiger Bildtyp." }, { status: 400 });
      }
      const showroomImages = [...(industry.showroomImages ?? [])];
      const current = showroomImages[index] ?? { title: `Showroom ${index + 1}`, description: "" };
      showroomImages[index] = { ...current, image: uploaded.url };
      await upsertIndustry({ ...industry, showroomImages });
    }

    return NextResponse.json(uploaded);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  await ensureAdminBootstrap();
  const permission = await requireModulePermission("fileUploads", "delete");
  if (!permission.ok) return NextResponse.json({ message: permission.message }, { status: permission.status });

  const body = await request.json().catch(() => null) as { industrySlug?: string; imageRole?: string; url?: string } | null;
  const industrySlug = safeSlug(String(body?.industrySlug ?? ""));
  const imageRole = safeSlug(String(body?.imageRole ?? ""));
  const url = String(body?.url ?? "").trim();

  if (!industrySlug || !imageRole) {
    return NextResponse.json({ message: "Branche und Bildtyp sind erforderlich." }, { status: 400 });
  }

  const industry = await getIndustryBySlug(industrySlug);
  if (!industry) return NextResponse.json({ message: "Branche nicht gefunden." }, { status: 404 });

  if (imageRole === "hero") {
    await upsertIndustry({ ...industry, heroImage: "" });
  } else if (imageRole.startsWith("showroom-")) {
    const index = Number(imageRole.replace("showroom-", "")) - 1;
    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json({ message: "Ungültiger Bildtyp." }, { status: 400 });
    }
    const showroomImages = [...(industry.showroomImages ?? [])];
    showroomImages.splice(index, 1);
    await upsertIndustry({ ...industry, showroomImages });
  } else {
    return NextResponse.json({ message: "Ungültiger Bildtyp." }, { status: 400 });
  }

  const deletion = url ? await deleteManagedUploadedFile(url, ["industries"]) : { deleted: false };
  return NextResponse.json({ success: true, fileDeleted: deletion.deleted });
}
