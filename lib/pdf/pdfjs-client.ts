"use client";

type PdfjsLib = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfjsLib> | null = null;
let configured = false;

export async function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("PDF preview is only available in the browser.");
  }
  pdfjsPromise ??= import("pdfjs-dist");
  const pdfjsLib = await pdfjsPromise;
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    configured = true;
  }
  return pdfjsLib;
}
