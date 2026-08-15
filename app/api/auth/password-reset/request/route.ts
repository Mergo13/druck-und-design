import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/catalog-repository";
import { logger } from "@/lib/logger";
import { issuePasswordResetToken, sendPasswordResetEmail } from "@/lib/password-reset";

function getAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ message: "Wenn ein Konto existiert, senden wir einen Link zum Zuruecksetzen." });
  }

  try {
    const user = await getUserByEmail(email);
    if (user) {
      const issued = await issuePasswordResetToken(email);
      const resetUrl = `${getAppUrl(request)}/passwort-zuruecksetzen?token=${encodeURIComponent(issued.token)}`;
      const sent = await sendPasswordResetEmail(email, resetUrl);
      return NextResponse.json({
        message: "Wenn ein Konto existiert, senden wir einen Link zum Zuruecksetzen.",
        resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
        sent: sent.sent
      });
    }
  } catch (error) {
    logger.error({ error }, "Password reset request failed.");
  }

  return NextResponse.json({ message: "Wenn ein Konto existiert, senden wir einen Link zum Zuruecksetzen." });
}
