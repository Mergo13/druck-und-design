import { createHmac, randomInt } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { logger } from "@/lib/logger";

const storePath = path.join(process.cwd(), "data", "admin-2fa-codes.json");
const ttlSeconds = 10 * 60;

type StoredCode = {
  email: string;
  codeHash: string;
  expiresAt: number;
  createdAt: number;
  attempts: number;
};

function codeHash(email: string, code: string) {
  const secret = process.env.AUTH_SECRET?.trim() || "dev-insecure-secret-change-me";
  return createHmac("sha256", secret).update(`${email}|${code}`).digest("hex");
}

async function readStore() {
  const raw = await fs.readFile(storePath, "utf8").catch(() => "[]");
  try {
    return JSON.parse(raw) as StoredCode[];
  } catch {
    return [] as StoredCode[];
  }
}

async function writeStore(rows: StoredCode[]) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(rows, null, 2), "utf8");
}

export async function issueAdmin2FACode(email: string) {
  const normalized = email.trim().toLowerCase();
  const code = String(randomInt(100000, 999999));
  const now = Math.floor(Date.now() / 1000);
  const rows = await readStore();
  const filtered = rows.filter((row) => row.email !== normalized && row.expiresAt > now);
  filtered.push({
    email: normalized,
    codeHash: codeHash(normalized, code),
    expiresAt: now + ttlSeconds,
    createdAt: now,
    attempts: 0
  });
  await writeStore(filtered);
  return { code, expiresAt: now + ttlSeconds };
}

export async function verifyAdmin2FACode(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const rows = await readStore();
  const idx = rows.findIndex((row) => row.email === normalized && row.expiresAt > now);
  if (idx < 0) return false;
  const row = rows[idx];
  if (row.attempts >= 5) return false;
  const valid = row.codeHash === codeHash(normalized, code.trim());
  row.attempts += 1;
  if (valid) {
    const next = rows.filter((entry) => entry.email !== normalized);
    await writeStore(next);
    return true;
  }
  rows[idx] = row;
  await writeStore(rows);
  return false;
}

export async function sendAdmin2FACode(email: string, code: string) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser || "kontakt@druck-und-design.at";
  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn({ email, code }, "SMTP not configured for admin 2FA; using development fallback");
    return { sent: false as const };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
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
