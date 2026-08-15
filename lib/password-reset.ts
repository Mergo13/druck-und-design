import { createHmac, randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const ttlSeconds = 60 * 60;

function getSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET fehlt.");
  return "dev-insecure-secret-change-me";
}

function hashToken(token: string) {
  return createHmac("sha256", getSecret()).update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function issuePasswordResetToken(email: string) {
  const normalized = normalizeEmail(email);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.passwordResetToken.upsert({
    where: { email: normalized },
    update: { tokenHash: hashToken(token), expiresAt, usedAt: null },
    create: { email: normalized, tokenHash: hashToken(token), expiresAt }
  });
  return { token, expiresAt };
}

export async function getPasswordResetEmail(token: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row.email;
}

export async function consumePasswordResetToken(token: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  await prisma.passwordResetToken.update({
    where: { email: row.email },
    data: { usedAt: new Date() }
  });
  return row.email;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser || "kontakt@druck-und-design.at";

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn({ email }, "SMTP not configured for password reset.");
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
    subject: "Passwort zuruecksetzen",
    text: `Sie koennen Ihr Passwort hier zuruecksetzen:\n${resetUrl}\n\nDer Link ist 60 Minuten gueltig.`
  });
  return { sent: true as const };
}
