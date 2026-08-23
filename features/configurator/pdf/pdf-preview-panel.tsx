"use client";

import type { ProductPdfConfig } from "@/types/print-platform";
import type { PdfClientSession } from "@/lib/pdf/pdf-types";
import { PdfPageThumbnail } from "@/features/configurator/pdf/pdf-page-thumbnail";

export function PdfPreviewPanel({ session, pdfConfig, totalPages }: { session: PdfClientSession; pdfConfig: ProductPdfConfig; totalPages: number }) {
  const mode = pdfConfig.previewMode ?? "none";
  if (mode === "none" || session.status === "idle") return null;
  if (session.status === "loading") {
    return <div className="rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600">PDF-Vorschau wird vorbereitet.</div>;
  }
  if (session.status === "error") {
    return <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">PDF-Vorschau konnte nicht geladen werden.</div>;
  }

  const pages = Array.from(
    { length: mode === "first-page" ? 1 : mode === "front-back" ? Math.min(2, totalPages) : Math.min(totalPages, 24) },
    (_, index) => index + 1
  );

  if (mode === "page-list") {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Seitenliste</p>
        <div className="mt-2 grid gap-1">
          {(session.pageMeta.length ? session.pageMeta : pages.map((pageNumber) => ({ pageNumber, widthMm: 0, heightMm: 0, orientation: "portrait" as const }))).map((page) => (
            <div key={page.pageNumber} className="flex justify-between gap-3 rounded border border-slate-100 px-2 py-1 font-semibold text-slate-700">
              <span>Seite {page.pageNumber}</span>
              <span>{page.widthMm && page.heightMm ? `${page.widthMm} x ${page.heightMm} mm` : "-"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">PDF-Vorschau</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {pages.map((page) => <PdfPageThumbnail key={page} pageNumber={page} getThumbnail={session.getThumbnail} />)}
      </div>
    </div>
  );
}
