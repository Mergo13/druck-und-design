import { NextResponse } from "next/server";
import { getSessionUser, createSessionToken, getSessionCookieName } from "@/lib/auth";
import { getUserByEmail, saveUser } from "@/lib/catalog-repository";
import { prisma } from "@/lib/prisma";
import { SessionUser, UserAccount } from "@/types";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const user = await getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ message: "Benutzer nicht gefunden" }, { status: 404 });
  }

  // Don't return password hash
  const { passwordHash, ...profile } = user;
  return NextResponse.json(profile);
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const body = await request.json() as Partial<UserAccount>;
  const user = await getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json({ message: "Benutzer nicht gefunden" }, { status: 404 });
  }

  const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : user.email;
  if (!requestedEmail) {
    return NextResponse.json({ message: "E-Mail ist erforderlich" }, { status: 400 });
  }

  if (requestedEmail !== user.email.toLowerCase()) {
    const existing = await getUserByEmail(requestedEmail);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ message: "Diese E-Mail ist bereits vergeben." }, { status: 409 });
    }
  }

  const updatedUser: UserAccount = {
    ...user,
    fullName: body.fullName ?? user.fullName,
    company: body.company ?? user.company,
    vatId: body.vatId ?? user.vatId,
    phone: body.phone ?? user.phone,
    email: requestedEmail,
    billingAddress: body.billingAddress ?? user.billingAddress,
    shippingAddress: body.shippingAddress ?? user.shippingAddress,
  };

  await saveUser(updatedUser);
  if (requestedEmail !== user.email.toLowerCase()) {
    await Promise.all([
      prisma.adminOrder.updateMany({
        where: { email: user.email.toLowerCase() },
        data: { email: requestedEmail }
      }),
      prisma.adminInvoice.updateMany({
        where: { email: user.email.toLowerCase() },
        data: { email: requestedEmail }
      }),
      prisma.review.updateMany({
        where: { email: user.email.toLowerCase() },
        data: { email: requestedEmail }
      })
    ]);
  }

  // Update session cookie with new data
  const newSession: SessionUser = {
    id: updatedUser.id,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    company: updatedUser.company,
    vatId: updatedUser.vatId,
    phone: updatedUser.phone,
    billingAddress: updatedUser.billingAddress,
    shippingAddress: updatedUser.shippingAddress,
  };

  const response = NextResponse.json({ message: "Profil aktualisiert", user: newSession });
  response.cookies.set(getSessionCookieName(), createSessionToken(newSession), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
