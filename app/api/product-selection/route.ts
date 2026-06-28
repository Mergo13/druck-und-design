import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

type SelectedProduct = {
  slug: string;
  name: string;
  category: string;
};

type ProductSelectionPayload = {
  clientEmail: string;
  clientName?: string;
  selectedProducts: SelectedProduct[];
};

function getEnv(name: string) {
  const value = process.env[name];
  return value ? value.trim() : "";
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "Bitte zuerst einloggen." }, { status: 401 });
  }

  const body = await request.json() as ProductSelectionPayload;
  if (!body.clientEmail || !Array.isArray(body.selectedProducts) || body.selectedProducts.length === 0) {
    return NextResponse.json({ message: "Ungültige Anfrage." }, { status: 400 });
  }

  const smtpHost = getEnv("SMTP_HOST");
  const smtpPort = Number(getEnv("SMTP_PORT") || "587");
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const notifyEmail = getEnv("PRODUCT_SELECTION_NOTIFY_EMAIL");
  const fromEmail = getEnv("SMTP_FROM_EMAIL") || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !notifyEmail || !fromEmail) {
    return NextResponse.json({ message: "E-Mail ist nicht konfiguriert." }, { status: 500 });
  }

  // `nodemailer` has no bundled TypeScript types in this project setup.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  const clientLabel = body.clientName?.trim() ? `${body.clientName} (${body.clientEmail})` : `${body.clientEmail} (Konto: ${user.email})`;
  const lines = body.selectedProducts.map((product) => `- ${product.name} (${product.slug}) [${product.category}]`);
  const text = [
    "Neue Produktauswahl von einem Client:",
    "",
    `Kontakt: ${clientLabel}`,
    "",
    "Ausgewählte Produkte:",
    ...lines
  ].join("\n");

  await transporter.sendMail({
    from: fromEmail,
    to: notifyEmail,
    replyTo: body.clientEmail,
    subject: `Neue Produktauswahl (${body.selectedProducts.length})`,
    text
  });

  return NextResponse.json({ success: true });
}
