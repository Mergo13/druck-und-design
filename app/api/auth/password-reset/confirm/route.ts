import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getUserByEmail, saveUser } from "@/lib/catalog-repository";
import { consumePasswordResetToken } from "@/lib/password-reset";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: string; password?: string };
  const token = body.token?.trim() ?? "";
  const password = body.password?.trim() ?? "";

  if (!token) {
    return NextResponse.json({ message: "Reset-Link fehlt." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "Das neue Passwort muss mindestens 6 Zeichen lang sein." }, { status: 400 });
  }

  const email = await consumePasswordResetToken(token);
  if (!email) {
    return NextResponse.json({ message: "Reset-Link ist ungueltig oder abgelaufen." }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "Reset-Link ist ungueltig oder abgelaufen." }, { status: 400 });
  }

  await saveUser({
    ...user,
    passwordHash: hashPassword(password)
  });

  return NextResponse.json({ message: "Passwort wurde aktualisiert." });
}
