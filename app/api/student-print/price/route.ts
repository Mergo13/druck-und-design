import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicProductBySlug } from "@/lib/catalog-repository";
import { calculateConfiguredProductPrice } from "@/lib/print-workflow";
import {
  STUDENT_PRINT_PRESETS,
  calculateSheets,
  deriveStudentProductionQuantities,
  productPriceConfig,
  resolveColorCounts,
  studentProductConfig,
  type PdfAnalysis,
  type StudentPrintSelection
} from "@/lib/student-print-config";

const selectionSchema = z.object({
  presetKey: z.string().min(1),
  productSlug: z.string().min(1),
  format: z.string().min(1),
  manualPageCount: z.number().int().min(1).max(10000).optional(),
  colorMode: z.enum(["auto", "bw", "color", "manual"]),
  manualColorPages: z.array(z.number().int().min(1)).default([]),
  printSides: z.enum(["simplex", "duplex"]),
  paper: z.enum(["80g-weiss", "100g-weiss", "120g-weiss", "170g-bilderdruck"]),
  binding: z.enum(["keine", "heftklammer", "spiralbindung", "klebebindung", "softcover", "hardcover"]),
  quantity: z.number().int().min(1).max(10000),
  production: z.enum(["standard", "express", "sameday"])
});

const analysisSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().optional(),
  pages: z.number().int().min(0).max(10000),
  dominantFormat: z.string().optional(),
  widthMm: z.number().optional(),
  heightMm: z.number().optional(),
  orientation: z.enum(["portrait", "landscape", "square"]).optional(),
  pageSizes: z.array(z.object({
    page: z.number().int().min(1),
    widthMm: z.number(),
    heightMm: z.number(),
    format: z.string().optional(),
    orientation: z.enum(["portrait", "landscape", "square"])
  })).default([]),
  colorPages: z.array(z.number().int().min(1)).default([]),
  bwPages: z.array(z.number().int().min(1)).default([]),
  warnings: z.array(z.object({
    type: z.string(),
    page: z.number().int().optional(),
    message: z.string()
  })).default([]),
  valid: z.boolean()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedSelection = selectionSchema.safeParse(body?.selection);
  const parsedAnalysis = analysisSchema.safeParse(body?.analysis);
  if (!parsedSelection.success) {
    return NextResponse.json({ message: "Ungültige Konfiguration." }, { status: 400 });
  }

  const selection = parsedSelection.data as StudentPrintSelection;
  const analysis = parsedAnalysis.success ? parsedAnalysis.data as PdfAnalysis : undefined;
  const preset = STUDENT_PRINT_PRESETS.find((item) => item.key === selection.presetKey && item.productSlug === selection.productSlug)
    ?? STUDENT_PRINT_PRESETS.find((item) => item.key === selection.presetKey);
  if (!preset) return NextResponse.json({ message: "Unbekannter Drucktyp." }, { status: 400 });
  if (!preset.supportedFormats.includes(selection.format)) {
    return NextResponse.json({ message: "Dieses Format ist für den gewählten Drucktyp nicht verfügbar." }, { status: 400 });
  }

  const product = await getPublicProductBySlug(selection.productSlug);
  if (!product || product.purchaseMode === "disabled" || product.purchaseMode === "request") {
    return NextResponse.json({ message: "Produkt ist aktuell nicht online bestellbar." }, { status: 400 });
  }

  const production = deriveStudentProductionQuantities(selection, analysis);
  if (production.pageCount <= 0) {
    return NextResponse.json({ message: "Bitte Seitenanzahl eingeben oder PDF hochladen." }, { status: 400 });
  }

  const productConfig = productPriceConfig(product, selection);
  const price = calculateConfiguredProductPrice(product, selection.quantity, productConfig, {
    baseQuantity: production.totalPrintedPages,
    propertyQuantity: production.quantity
  });
  const color = resolveColorCounts(selection, analysis);
  const sheets = calculateSheets(production.pageCount, selection.printSides);
  const productionConfig = studentProductConfig(selection, analysis);

  return NextResponse.json({
    product: {
      slug: product.slug,
      name: product.name,
      category: product.category
    },
    price,
    unitPrice: price.total,
    quantity: selection.quantity,
    total: price.total,
    sheets,
    production,
    color,
    config: {
      ...productionConfig,
      "Server-Preis": `${production.quantity} ${production.quantity === 1 ? "Exemplar" : "Exemplare"}: ${price.total.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`,
      "Preis-Hinweis": "Preis wurde serverseitig aus dem bestehenden Produkt berechnet."
    }
  });
}
