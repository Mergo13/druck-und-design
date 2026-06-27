import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_EXTENSIONS = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".svg", ".eps", ".doc", ".docx"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "Datei ist zu groß. Maximal 50 MB." }, { status: 400 });
  }

  const lower = file.name.toLowerCase();
  const extension = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json({ message: "Dateityp nicht erlaubt." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const timestamp = Date.now();
  const filename = `${timestamp}-${Math.random().toString(36).slice(2, 10)}-${sanitizeFilename(file.name)}`;
  const relativeDir = path.join("uploads", "contact");
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  const absoluteFile = path.join(absoluteDir, filename);

  await fs.mkdir(absoluteDir, { recursive: true });
  await fs.writeFile(absoluteFile, buffer);

  return NextResponse.json({
    url: `/${relativeDir}/${filename}`,
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream"
  });
}
