import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

function isAllowedPdfUrl(rawUrl: string, crmApiUrl: string) {
  try {
    const target = new URL(rawUrl);
    const crmBase = new URL(crmApiUrl);
    const sameHost = target.hostname === crmBase.hostname;
    if (!sameHost) return false;

    const isLocalHost = target.hostname === "localhost" || target.hostname === "127.0.0.1";
    if (isLocalHost) {
      return target.protocol === "http:" || target.protocol === "https:";
    }

    return target.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session?.email) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  const crmApiUrl = process.env.CRM_API_URL?.trim();
  const crmToken = process.env.CRM_API_TOKEN?.trim();
  if (!crmApiUrl || !crmToken) {
    return NextResponse.json({ message: "CRM Konfiguration fehlt" }, { status: 500 });
  }

  const url = new URL(request.url);
  const pdfUrl = url.searchParams.get("url")?.trim() || "";
  if (!pdfUrl) {
    return NextResponse.json({ message: "PDF URL fehlt" }, { status: 400 });
  }

  if (!isAllowedPdfUrl(pdfUrl, crmApiUrl)) {
    return NextResponse.json({ message: "Ungültige PDF URL" }, { status: 400 });
  }

  try {
    const crmRes = await fetch(pdfUrl, {
      headers: {
        Authorization: `Bearer ${crmToken}`,
        Accept: "application/pdf,application/octet-stream,*/*"
      },
      cache: "no-store"
    });

    if (!crmRes.ok) {
      const text = await crmRes.text().catch(() => "");
      return NextResponse.json(
        { message: `CRM PDF request failed (${crmRes.status})`, detail: text.slice(0, 300) },
        { status: 502 }
      );
    }

    const contentType = crmRes.headers.get("content-type") || "application/pdf";
    const contentDisposition = crmRes.headers.get("content-disposition") || 'inline; filename="rechnung.pdf"';
    const data = await crmRes.arrayBuffer();

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: "CRM PDF Abruf fehlgeschlagen", detail: error instanceof Error ? error.message : String(error) },
      { status: 502 }
    );
  }
}
