import { NextResponse } from "next/server";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getUserByEmail, saveUser } from "@/lib/catalog-repository";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await request.json() as { currentPassword?: string; newPassword?: string };
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "Aktuelles und neues Passwort sind erforderlich" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ message: "Das neue Passwort muss mindestens 6 Zeichen lang sein" }, { status: 400 });
  }

  const user = await getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ message: "Benutzer nicht gefunden" }, { status: 404 });
  }

  const isCorrect = verifyPassword(currentPassword, user.passwordHash);
  if (!isCorrect) {
    return NextResponse.json({ message: "Das aktuelle Passwort ist nicht korrekt" }, { status: 401 });
  }

  await saveUser({
    ...user,
    passwordHash: hashPassword(newPassword)
  });

  return NextResponse.json({ message: "Passwort erfolgreich geändert" });
}
