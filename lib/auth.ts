import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types";

const SESSION_COOKIE = "dud_session";
const ADMIN_2FA_COOKIE = "dud_admin_2fa";

function getSecret() {
  return process.env.AUTH_SECRET?.trim() || "dev-insecure-secret-change-me";
}

function b64(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function unb64(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomUUID().replaceAll("-", "");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, expectedHash] = passwordHash.split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

export function createSessionToken(user: SessionUser) {
  const payload = b64(JSON.stringify(user));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function parseSessionToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    return JSON.parse(unb64(payload)) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return parseSessionToken(token);
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

type Admin2FAPayload = {
  email: string;
  verifiedAt: number;
  exp: number;
};

export function createAdmin2FAToken(email: string, ttlSeconds = 60 * 60 * 12) {
  const now = Math.floor(Date.now() / 1000);
  const payload: Admin2FAPayload = {
    email: email.trim().toLowerCase(),
    verifiedAt: now,
    exp: now + ttlSeconds
  };
  const encoded = b64(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function parseAdmin2FAToken(token?: string | null): Admin2FAPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const decoded = JSON.parse(unb64(payload)) as Admin2FAPayload;
    if (!decoded.email || typeof decoded.exp !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getAdmin2FACookieName() {
  return ADMIN_2FA_COOKIE;
}

export async function isAdmin2FAVerifiedFor(email?: string | null) {
  if (!email) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_2FA_COOKIE)?.value;
  const payload = parseAdmin2FAToken(token);
  if (!payload) return false;
  return payload.email === email.trim().toLowerCase();
}
