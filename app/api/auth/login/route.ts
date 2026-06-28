import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/catalog-repository";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password?.trim() ?? "";
  if (!email || !password) {
    return NextResponse.json({ message: "E-Mail und Passwort sind erforderlich." }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ message: "Ungültige Login-Daten." }, { status: 401 });
  }

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
