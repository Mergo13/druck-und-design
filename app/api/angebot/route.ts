import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { LEGAL_DOCUMENT_FOOTER } from "@/lib/legal";

type AngebotItem = {
  slug: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice?: number;
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Bitte zuerst einloggen." }, { status: 401 });
  }

  const body = await request.json() as { items?: AngebotItem[]; notes?: string };
  const items = body.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ message: "Warenkorb ist leer." }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const notifyEmail = process.env.PRODUCT_SELECTION_NOTIFY_EMAIL?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser;
  if (!smtpHost || !smtpUser || !smtpPass || !notifyEmail || !fromEmail) {
    return NextResponse.json({ message: "E-Mail ist nicht konfiguriert." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  const lines = items.map((item) => {
    const total = typeof item.unitPrice === "number" ? ` | Einzelpreis: ${item.unitPrice.toFixed(2)} EUR | Summe: ${(item.unitPrice * item.quantity).toFixed(2)} EUR` : "";
    return `- ${item.name} (${item.slug}) [${item.category}] x ${item.quantity}${total}`;
  });
  const text = [
    "Neue Bestellung aus dem Warenkorb",
    "",
    `Kunde: ${user.company ? `${user.company} / ` : ""}${user.email}`,
    "",
    "Produkte:",
    ...lines,
    "",
    "Hinweise:",
    body.notes?.trim() || "-",
    "",
    LEGAL_DOCUMENT_FOOTER
  ].join("\n");

  await transporter.sendMail({
    from: fromEmail,
    to: notifyEmail,
    replyTo: user.email,
    subject: `Neue Bestellung aus Warenkorb (${items.length})`,
    text
  });

  return NextResponse.json({ success: true });
}
