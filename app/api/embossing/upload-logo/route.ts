import { NextResponse } from "next/server";
import { requireEmbossingUser } from "@/lib/embossing/server";
import { saveUploadedFile } from "@/lib/file-storage";

const ALLOWED_EXTENSIONS = [".svg", ".pdf", ".png"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireEmbossingUser();
  if (!auth.ok) return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }
  try {
    const uploaded = await saveUploadedFile(file, {
      folder: "embossing",
      allowedExtensions: ALLOWED_EXTENSIONS,
      maxBytes: MAX_FILE_SIZE,
      filenameBase: `${auth.session.id}-logo`
    });
    return NextResponse.json(uploaded);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Logo-Upload fehlgeschlagen." }, { status: 400 });
  }
}
