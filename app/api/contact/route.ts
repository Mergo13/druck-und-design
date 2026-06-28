import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureAdminBootstrap } from "@/lib/admin-bootstrap";
import { saveContactLead } from "@/lib/contact-leads";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const DEFAULT_CONTACT_EMAIL = "kontakt@druck-und-design.at";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  topic: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  files: z.array(
    z.object({
      name: z.string().min(1).max(240),
      url: z.string().min(1).max(1024),
      size: z.number().int().nonnegative().optional(),
      mimeType: z.string().min(1).max(160).optional()
    })
  ).max(10).optional().default([])
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: "Bitte alle Felder korrekt ausfuellen." }, { status: 400 });
  }

  const lead = await saveContactLead({
    id: randomUUID(),
    source: "contact-form",
    createdAt: new Date().toISOString(),
    ...parsed.data
  });
  await ensureAdminBootstrap();
  await prisma.contactFileUpload.create({
    data: {
      name: lead.name,
      email: lead.email,
      topic: lead.topic,
      message: lead.message,
      files: parsed.data.files
    }
  });

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT?.trim() || "587");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser || DEFAULT_CONTACT_EMAIL;
  const notifyEmail =
    process.env.CONTACT_NOTIFY_EMAIL?.trim() ||
    process.env.PRODUCT_SELECTION_NOTIFY_EMAIL?.trim() ||
    DEFAULT_CONTACT_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail || !notifyEmail) {
    logger.warn({ leadId: lead.id }, "Kontaktanfrage gespeichert, aber SMTP ist nicht konfiguriert.");
    return NextResponse.json({ success: true, queued: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: notifyEmail,
      replyTo: lead.email,
      subject: `Neue Kontaktanfrage: ${lead.topic}`,
      text: [
        "Neue Kontaktanfrage ueber druck&design studio",
        "",
        `Lead-ID: ${lead.id}`,
        `Zeit: ${lead.createdAt}`,
        `Name: ${lead.name}`,
        `E-Mail: ${lead.email}`,
        `Thema: ${lead.topic}`,
        `Dateien: ${parsed.data.files.length ? parsed.data.files.map((file) => file.url).join(", ") : "-"}`,
        "",
        "Nachricht:",
        lead.message
      ].join("\n")
    });
  } catch (error) {
    logger.error({ leadId: lead.id, error }, "SMTP Versand fuer Kontaktanfrage fehlgeschlagen.");
    return NextResponse.json(
      { message: "Anfrage gespeichert, aber E-Mail-Versand ist fehlgeschlagen. Bitte SMTP-Zugang pruefen." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
