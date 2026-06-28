import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { issueAdmin2FACode, sendAdmin2FACode } from "@/lib/admin-2fa";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ message: "Nicht eingeloggt." }, { status: 401 });
  }
  await ensureAdminBootstrap();
  const admin = await prisma.adminUser.findUnique({ where: { email: sessionUser.email } });
  if (!admin?.active) {
    return NextResponse.json({ message: "Kein aktiver Admin-Zugang." }, { status: 403 });
  }
  const issued = await issueAdmin2FACode(sessionUser.email);
  const sent = await sendAdmin2FACode(sessionUser.email, issued.code);
  return NextResponse.json({
    success: true,
    sent: sent.sent,
    // Development fallback visibility
    code: process.env.NODE_ENV === "production" ? undefined : issued.code
  });
}
