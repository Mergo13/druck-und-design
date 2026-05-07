import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ message: "Nur Bilddateien sind erlaubt." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
  const relativeDir = path.join("uploads", "products");
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await fs.mkdir(absoluteDir, { recursive: true });
  await fs.writeFile(path.join(absoluteDir, filename), buffer);

  return NextResponse.json({ url: `/${relativeDir}/${filename}` });
}
