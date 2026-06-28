import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const ttlSeconds = 10 * 60;

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET fehlt.");
  return "dev-insecure-secret-change-me";
}

function codeHash(email: string, code: string) {
  return createHmac("sha256", getSecret()).update(`${email}|${code}`).digest("hex");
}

export async function issueAdmin2FACode(email: string) {
  const normalized = email.trim().toLowerCase();
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.adminTwoFactorCode.upsert({
    where: { email: normalized },
    update: { codeHash: codeHash(normalized, code), expiresAt, attempts: 0 },
    create: { email: normalized, codeHash: codeHash(normalized, code), expiresAt, attempts: 0 }
  });
  return { code, expiresAt: Math.floor(expiresAt.getTime() / 1000) };
}

export async function verifyAdmin2FACode(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const row = await prisma.adminTwoFactorCode.findUnique({ where: { email: normalized } });
  if (!row || row.expiresAt.getTime() < Date.now() || row.attempts >= 5) return false;

  const actual = Buffer.from(codeHash(normalized, code.trim()), "hex");
  const expected = Buffer.from(row.codeHash, "hex");
  const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
  if (valid) {
    await prisma.adminTwoFactorCode.delete({ where: { email: normalized } });
    return true;
  }
  await prisma.adminTwoFactorCode.update({
    where: { email: normalized },
    data: { attempts: { increment: 1 } }
  });
  return false;
}

export async function sendAdmin2FACode(email: string, code: string) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser || "kontakt@druck-und-design.at";
  if (!smtpHost || !smtpUser || !smtpPass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP muss für Admin-2FA konfiguriert sein.");
    }
    logger.warn({ email }, "SMTP not configured for admin 2FA; using development fallback");
    return { sent: false as const };
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });
  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: "Ihr Admin 2FA Code",
    text: `Ihr Admin-Login-Code lautet: ${code}\nGültig für 10 Minuten.`
  });
  return { sent: true as const };
}
