import { NextResponse } from "next/server";
import { createAdmin2FAToken, getAdmin2FACookieName, getSessionUser } from "@/lib/auth";
import { verifyAdmin2FACode } from "@/lib/admin-2fa";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ message: "Nicht eingeloggt." }, { status: 401 });
  }
  await ensureAdminBootstrap();
  const admin = await prisma.adminUser.findUnique({ where: { email: sessionUser.email } });
  if (!admin?.active) {
    return NextResponse.json({ message: "Kein aktiver Admin-Zugang." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as { code?: string };
  const code = body.code?.trim() ?? "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Ungültiger Code." }, { status: 400 });
  }
  const valid = await verifyAdmin2FACode(sessionUser.email, code);
  if (!valid) {
    return NextResponse.json({ message: "Code ungültig oder abgelaufen." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set(getAdmin2FACookieName(), createAdmin2FAToken(sessionUser.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
