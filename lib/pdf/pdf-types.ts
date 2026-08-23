import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

export type PdfPageMeta = {
  pageNumber: number;
  widthMm: number;
  heightMm: number;
  orientation: "portrait" | "landscape";
};

export type PdfClientSession = {
  status: "idle" | "loading" | "ready" | "error";
  document: PDFDocumentProxy | null;
  pageMeta: PdfPageMeta[];
  getThumbnail(pageNumber: number): Promise<string>;
  clear(): void;
  error?: string;
};
