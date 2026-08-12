import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserByEmail, saveUser } from "@/lib/catalog-repository";
import type { UserAccount } from "@/types";

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function extensionOf(name: string) {
  const lower = name.toLowerCase();
  return lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session?.email) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const university = String(form.get("university") ?? "").trim();
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Keine Datei empfangen." }, { status: 400 });
  }
  if (!university) {
    return NextResponse.json({ message: "Universität/FH ist erforderlich." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "Datei ist zu groß oder leer. Maximal 10 MB." }, { status: 400 });
  }
  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json({ message: "Dateityp nicht erlaubt." }, { status: 400 });
  }

  const user = await getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ message: "Benutzer nicht gefunden" }, { status: 404 });
  }

  const relativePath = path.join("student-verifications", user.id, `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName(file.name)}`);
  const absolutePath = path.join(process.cwd(), "data", "private", relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const updatedUser = {
    ...(user as UserAccount),
    studentVerification: {
      university,
      status: "pending",
      submittedAt: new Date().toISOString(),
      documentPath: relativePath.replace(/\\/g, "/")
    }
  } as UserAccount & { studentVerification: Record<string, string> };
  await saveUser(updatedUser);

  return NextResponse.json({
    status: "pending",
    university,
    submittedAt: updatedUser.studentVerification.submittedAt
  });
}

