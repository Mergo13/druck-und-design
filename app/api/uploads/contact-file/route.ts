import { NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/file-storage";

const ALLOWED_EXTENSIONS = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".svg", ".eps", ".doc", ".docx"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }

  try {
    return NextResponse.json(await saveUploadedFile(file, {
      folder: "contact",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE
    }));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Upload fehlgeschlagen." }, { status: 400 });
  }
}
