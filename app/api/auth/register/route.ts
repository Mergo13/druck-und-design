import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSessionCookieName, createSessionToken, hashPassword } from "@/lib/auth";
import { getUserByEmail, saveUser } from "@/lib/catalog-repository";

export async function POST(request: Request) {
  const body = await request.json() as { company?: string; email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password?.trim() ?? "";
  const company = body.company?.trim() ?? "";

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ message: "Bitte gültige Daten eingeben (Passwort min. 6 Zeichen)." }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ message: "Diese E-Mail ist bereits registriert." }, { status: 409 });
  }

  const user = await saveUser({
    id: randomUUID(),
    company: company || undefined,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  });

  const response = NextResponse.json({ id: user.id, company: user.company, email: user.email });
  response.cookies.set(getSessionCookieName(), createSessionToken({ 
    id: user.id, 
    fullName: user.fullName,
    company: user.company, 
    phone: user.phone,
    email: user.email,
    vatId: user.vatId,
    billingAddress: user.billingAddress,
    shippingAddress: user.shippingAddress
  }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
