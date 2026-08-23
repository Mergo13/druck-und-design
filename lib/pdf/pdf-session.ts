"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { getPdfjs } from "@/lib/pdf/pdfjs-client";
import type { PdfClientSession, PdfPageMeta } from "@/lib/pdf/pdf-types";

const MM_PER_POINT = 25.4 / 72;

function pageMetaFromViewport(pageNumber: number, width: number, height: number): PdfPageMeta {
  const widthMm = Math.round(width * MM_PER_POINT * 10) / 10;
  const heightMm = Math.round(height * MM_PER_POINT * 10) / 10;
  return {
    pageNumber,
    widthMm,
    heightMm,
    orientation: widthMm > heightMm ? "landscape" : "portrait"
  };
}

export function usePdfSession(file: File | null): PdfClientSession {
  const [status, setStatus] = useState<PdfClientSession["status"]>("idle");
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageMeta, setPageMeta] = useState<PdfPageMeta[]>([]);
  const [error, setError] = useState<string>();
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const thumbnailCache = useRef(new Map<number, Promise<string>>());

  const clear = useCallback(() => {
    thumbnailCache.current.clear();
    setPageMeta([]);
    setError(undefined);
    setStatus("idle");
    setDocument(null);
    if (documentRef.current) {
      void documentRef.current.cleanup();
      documentRef.current = null;
    }
  }, []);

  useEffect(() => {
    clear();
    if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) return;
    let cancelled = false;
    setStatus("loading");
    void (async () => {
      try {
        const pdfjs = getPdfjs();
        const bytes = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }
        documentRef.current = pdf;
        setDocument(pdf);
        setStatus("ready");
        const firstPages = await Promise.all(
          Array.from({ length: Math.min(pdf.numPages, 12) }, async (_, index) => {
            const page = await pdf.getPage(index + 1);
            const viewport = page.getViewport({ scale: 1 });
            page.cleanup();
            return pageMetaFromViewport(index + 1, viewport.width, viewport.height);
          })
        );
        if (!cancelled) setPageMeta(firstPages);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "PDF konnte nicht geöffnet werden.");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      thumbnailCache.current.clear();
      if (documentRef.current) {
        void documentRef.current.cleanup();
        documentRef.current = null;
      }
    };
  }, [clear, file]);

  const getThumbnail = useCallback(async (pageNumber: number) => {
    const pdf = documentRef.current;
    if (!pdf) return "";
    const cached = thumbnailCache.current.get(pageNumber);
    if (cached) return cached;
    const promise = (async () => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 0.28 });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) return "";
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.68);
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      return dataUrl;
    })();
    thumbnailCache.current.set(pageNumber, promise);
    return promise;
  }, []);

  return { status, document, pageMeta, getThumbnail, clear, error };
}
