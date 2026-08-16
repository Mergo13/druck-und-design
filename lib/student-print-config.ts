import type { ProductCatalogItem } from "@/types/print-platform";

export type StudentPrintAudience = "student" | "school";
export type StudentPrintPresetKey =
  | "skript"
  | "seminararbeit"
  | "bachelorarbeit"
  | "masterarbeit"
  | "diplomarbeit"
  | "dissertation"
  | "praesentation"
  | "poster"
  | "allgemeines-dokument"
  | "lernunterlagen"
  | "arbeitsblaetter"
  | "referat"
  | "projektarbeit"
  | "abschlussarbeit-schule"
  | "handout";

export type PrintSideMode = "simplex" | "duplex";
export type StudentColorMode = "auto" | "bw" | "color" | "manual";
export type StudentPaper = "80g-weiss" | "100g-weiss" | "120g-weiss" | "170g-bilderdruck";
export type StudentBinding = "keine" | "heftklammer" | "spiralbindung" | "klebebindung" | "softcover" | "hardcover";
export type PdfOrientation = "portrait" | "landscape" | "square";

export type PdfPageSize = {
  page: number;
  widthMm: number;
  heightMm: number;
  format?: string;
  orientation: PdfOrientation;
};

export type PdfAnalysisWarning = {
  type: "invalid" | "password" | "mixed-size" | "low-resolution" | "unknown-color" | "unsupported-format";
  page?: number;
  message: string;
};

export type PdfAnalysis = {
  fileName: string;
  fileUrl?: string;
  pages: number;
  dominantFormat?: string;
  widthMm?: number;
  heightMm?: number;
  orientation?: PdfOrientation;
  pageSizes: PdfPageSize[];
  colorPages: number[];
  bwPages: number[];
  warnings: PdfAnalysisWarning[];
  valid: boolean;
};

export type StudentPrintSelection = {
  presetKey: StudentPrintPresetKey;
  productSlug: string;
  format: string;
  colorMode: StudentColorMode;
  manualColorPages: number[];
  printSides: PrintSideMode;
  paper: StudentPaper;
  binding: StudentBinding;
  quantity: number;
  production: "standard" | "express" | "sameday";
};

export type StudentPrintPreset = {
  key: StudentPrintPresetKey;
  audience: StudentPrintAudience;
  label: string;
  productSlug: string;
  defaults: Pick<StudentPrintSelection, "format" | "colorMode" | "printSides" | "paper" | "binding" | "production">;
  supportedFormats: string[];
};

export const STUDENT_PRINT_PRESETS: StudentPrintPreset[] = [
  { key: "skript", audience: "student", label: "Skript / Lernunterlagen", productSlug: "abschlussarbeiten", supportedFormats: ["A4", "A5"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "80g-weiss", binding: "spiralbindung", production: "standard" } },
  { key: "seminararbeit", audience: "student", label: "Seminararbeit", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "klebebindung", production: "standard" } },
  { key: "bachelorarbeit", audience: "student", label: "Bachelorarbeit", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "hardcover", production: "standard" } },
  { key: "masterarbeit", audience: "student", label: "Masterarbeit", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "hardcover", production: "standard" } },
  { key: "diplomarbeit", audience: "student", label: "Diplomarbeit", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "hardcover", production: "standard" } },
  { key: "dissertation", audience: "student", label: "Dissertation", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "hardcover", production: "standard" } },
  { key: "praesentation", audience: "student", label: "Präsentation", productSlug: "magazine", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "simplex", paper: "120g-weiss", binding: "keine", production: "standard" } },
  { key: "poster", audience: "student", label: "Wissenschaftliches Poster", productSlug: "plakate", supportedFormats: ["A3", "A2", "A1", "A0"], defaults: { format: "A1", colorMode: "color", printSides: "simplex", paper: "170g-bilderdruck", binding: "keine", production: "standard" } },
  { key: "allgemeines-dokument", audience: "student", label: "Allgemeines Dokument", productSlug: "abschlussarbeiten", supportedFormats: ["A4", "A5"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "80g-weiss", binding: "keine", production: "standard" } },
  { key: "lernunterlagen", audience: "school", label: "Lernunterlagen", productSlug: "abschlussarbeiten", supportedFormats: ["A4", "A5"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "80g-weiss", binding: "spiralbindung", production: "standard" } },
  { key: "arbeitsblaetter", audience: "school", label: "Arbeitsblätter", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "80g-weiss", binding: "keine", production: "standard" } },
  { key: "referat", audience: "school", label: "Referat", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "simplex", paper: "80g-weiss", binding: "heftklammer", production: "standard" } },
  { key: "projektarbeit", audience: "school", label: "Projektarbeit", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "spiralbindung", production: "standard" } },
  { key: "abschlussarbeit-schule", audience: "school", label: "Abschlussarbeit", productSlug: "abschlussarbeiten", supportedFormats: ["A4"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "100g-weiss", binding: "klebebindung", production: "standard" } },
  { key: "handout", audience: "school", label: "Handout", productSlug: "abschlussarbeiten", supportedFormats: ["A4", "A5"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "80g-weiss", binding: "heftklammer", production: "standard" } },
  { key: "poster", audience: "school", label: "Poster / Plakat", productSlug: "plakate", supportedFormats: ["A3", "A2", "A1", "A0"], defaults: { format: "A2", colorMode: "color", printSides: "simplex", paper: "170g-bilderdruck", binding: "keine", production: "standard" } },
  { key: "allgemeines-dokument", audience: "school", label: "Allgemeines Dokument", productSlug: "abschlussarbeiten", supportedFormats: ["A4", "A5"], defaults: { format: "A4", colorMode: "auto", printSides: "duplex", paper: "80g-weiss", binding: "keine", production: "standard" } }
];

const ISO_FORMATS = [
  { name: "A0", width: 841, height: 1189 },
  { name: "A1", width: 594, height: 841 },
  { name: "A2", width: 420, height: 594 },
  { name: "A3", width: 297, height: 420 },
  { name: "A4", width: 210, height: 297 },
  { name: "A5", width: 148, height: 210 }
];

export function calculateSheets(pageCount: number, printSides: PrintSideMode) {
  const pages = Math.max(0, Math.floor(pageCount));
  return printSides === "duplex" ? Math.ceil(pages / 2) : pages;
}

function safeCopyQuantity(quantity: number) {
  return Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
}

export function deriveStudentProductionQuantities(selection: Pick<StudentPrintSelection, "quantity" | "printSides" | "colorMode" | "manualColorPages">, analysis?: PdfAnalysis) {
  const pageCount = Math.max(0, Math.floor(analysis?.pages ?? 0));
  const quantity = safeCopyQuantity(selection.quantity);
  const sheetsPerCopy = calculateSheets(pageCount, selection.printSides);
  const color = resolveColorCounts(selection as StudentPrintSelection, analysis);
  return {
    pageCount,
    quantity,
    printSides: selection.printSides,
    sheetsPerCopy,
    totalPrintedPages: pageCount * quantity,
    totalSheets: sheetsPerCopy * quantity,
    colorPagesPerCopy: color.colorCount,
    bwPagesPerCopy: color.bwCount,
    totalColorPages: color.colorCount * quantity,
    totalBwPages: color.bwCount * quantity
  };
}

export function orientationForSize(widthMm: number, heightMm: number): PdfOrientation {
  if (Math.abs(widthMm - heightMm) <= 1) return "square";
  return widthMm > heightMm ? "landscape" : "portrait";
}

export function recognizeIsoFormat(widthMm: number, heightMm: number, toleranceMm = 4) {
  const sorted = [widthMm, heightMm].sort((a, b) => a - b);
  for (const format of ISO_FORMATS) {
    const expected = [format.width, format.height].sort((a, b) => a - b);
    if (Math.abs(sorted[0] - expected[0]) <= toleranceMm && Math.abs(sorted[1] - expected[1]) <= toleranceMm) {
      return format.name;
    }
  }
  return undefined;
}

export function summarizeMixedPageSizes(pageSizes: PdfPageSize[]) {
  const groups = new Map<string, { label: string; pages: number[]; widthMm: number; heightMm: number }>();
  for (const size of pageSizes) {
    const label = size.format ?? `${Math.round(size.widthMm)} x ${Math.round(size.heightMm)} mm`;
    const key = `${label}:${Math.round(size.widthMm)}:${Math.round(size.heightMm)}`;
    const group = groups.get(key) ?? { label, pages: [], widthMm: size.widthMm, heightMm: size.heightMm };
    group.pages.push(size.page);
    groups.set(key, group);
  }
  return Array.from(groups.values()).sort((a, b) => b.pages.length - a.pages.length);
}

export function parsePageRange(input: string, pageCount: number) {
  const pages = new Set<number>();
  const trimmed = input.trim();
  if (!trimmed) return { pages: [] as number[], error: "" };
  for (const rawPart of trimmed.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = part.match(/^\d+$/);
    if (!range && !single) {
      return { pages: [] as number[], error: `Der Eintrag "${part}" ist ungültig. Bitte nutze z.B. 1,2,5-8.` };
    }
    const start = range ? Number(range[1]) : Number(part);
    const end = range ? Number(range[2]) : start;
    if (start < 1 || end < 1) return { pages: [] as number[], error: "Seitennummern müssen größer als 0 sein." };
    if (end < start) return { pages: [] as number[], error: `Der Bereich ${part} ist ungültig.` };
    if (end > pageCount) {
      return { pages: [] as number[], error: `Die Seite ${end} existiert nicht. Das Dokument hat ${pageCount} Seiten.` };
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }
  return { pages: Array.from(pages).sort((a, b) => a - b), error: "" };
}

export function colorAccounting(pageCount: number, colorPages: number[]) {
  const unique = Array.from(new Set(colorPages.filter((page) => page >= 1 && page <= pageCount))).sort((a, b) => a - b);
  return {
    colorPages: unique,
    bwPages: Array.from({ length: Math.max(0, pageCount) }, (_, index) => index + 1).filter((page) => !unique.includes(page)),
    colorCount: unique.length,
    bwCount: Math.max(0, pageCount - unique.length)
  };
}

export function getAvailableBindings(input: { pages: number; sheets: number; format: string; presetKey: StudentPrintPresetKey }) {
  const all: Array<{ value: StudentBinding; label: string; available: boolean; reason?: string }> = [
    { value: "keine", label: "Keine Bindung", available: true },
    { value: "heftklammer", label: "Heftklammer", available: input.sheets <= 40, reason: "Nicht verfügbar bei dieser Blattzahl." },
    { value: "spiralbindung", label: "Spiralbindung", available: input.sheets <= 250, reason: "Nicht verfügbar bei dieser Blattzahl." },
    { value: "klebebindung", label: "Klebebindung", available: input.format === "A4" && input.sheets >= 20 && input.sheets <= 300, reason: "Nur A4 und ab ca. 20 Blatt verfügbar." },
    { value: "softcover", label: "Softcover", available: input.format === "A4" && input.sheets >= 20 && input.sheets <= 300, reason: "Nur A4 und ab ca. 20 Blatt verfügbar." },
    { value: "hardcover", label: "Hardcover", available: input.format === "A4" && input.sheets >= 20 && input.sheets <= 320, reason: "Nur A4 und ab ca. 20 Blatt verfügbar." }
  ];
  if (input.presetKey === "poster") return all.filter((item) => item.value === "keine");
  return all;
}

export function recommendPaper(presetKey: StudentPrintPresetKey, pages: number): StudentPaper {
  if (presetKey === "poster") return "170g-bilderdruck";
  if (["bachelorarbeit", "masterarbeit", "diplomarbeit", "dissertation", "abschlussarbeit-schule", "seminararbeit", "projektarbeit"].includes(presetKey)) return "100g-weiss";
  if (pages > 140) return "80g-weiss";
  return "80g-weiss";
}

export function recommendBinding(input: { presetKey: StudentPrintPresetKey; pages: number; sheets: number; format: string }): StudentBinding {
  if (input.presetKey === "poster") return "keine";
  if (["bachelorarbeit", "masterarbeit", "diplomarbeit", "dissertation"].includes(input.presetKey) && input.format === "A4" && input.sheets >= 20) return "hardcover";
  if (input.pages <= 12 && input.sheets <= 40) return "heftklammer";
  if (input.pages >= 120) return "spiralbindung";
  if (input.sheets >= 20 && input.format === "A4") return "klebebindung";
  return "keine";
}

export function estimateBlockThicknessMm(sheets: number, paper: StudentPaper) {
  const caliper: Record<StudentPaper, number> = {
    "80g-weiss": 0.1,
    "100g-weiss": 0.12,
    "120g-weiss": 0.145,
    "170g-bilderdruck": 0.17
  };
  return Math.round(sheets * caliper[paper] * 10) / 10;
}

export function studentProductConfig(selection: StudentPrintSelection, analysis?: PdfAnalysis) {
  const production = deriveStudentProductionQuantities(selection, analysis);
  const pages = production.pageCount;
  const color = resolveColorCounts(selection, analysis);
  const sheets = production.sheetsPerCopy;
  return {
    Menge: String(production.quantity),
    Auflage: `${production.quantity} ${production.quantity === 1 ? "Exemplar" : "Exemplare"}`,
    Format: selection.format,
    "PDF-Seiten": pages ? String(pages) : "-",
    "Seiten pro Exemplar": pages ? String(pages) : "-",
    "Druckseiten gesamt": pages ? String(production.totalPrintedPages) : "-",
    "Blätter pro Exemplar": pages ? String(sheets) : "-",
    "Blätter gesamt": pages ? String(production.totalSheets) : "-",
    Druckseiten: selection.printSides === "duplex" ? "Beidseitig" : "Einseitig",
    Druckfarbe: color.label,
    "Farbseiten pro Exemplar": String(production.colorPagesPerCopy),
    Farbseiten: String(production.colorPagesPerCopy),
    "Farbseiten gesamt": String(production.totalColorPages),
    "SW-Seiten pro Exemplar": String(production.bwPagesPerCopy),
    "SW-Seiten": String(production.bwPagesPerCopy),
    "SW-Seiten gesamt": String(production.totalBwPages),
    Papier: paperLabel(selection.paper),
    Bindung: bindingLabel(selection.binding),
    Produktion: productionLabel(selection.production),
    ...(analysis?.fileUrl ? { PrintDatei: analysis.fileUrl } : {}),
    ...(analysis?.fileName ? { Datei: analysis.fileName } : {})
  };
}

export function resolveColorCounts(selection: StudentPrintSelection, analysis?: PdfAnalysis) {
  const pages = analysis?.pages ?? 0;
  if (selection.colorMode === "bw") return { colorCount: 0, bwCount: pages, colorPages: [], label: "Alles Schwarz-Weiß" };
  if (selection.colorMode === "color") return { colorCount: pages, bwCount: 0, colorPages: Array.from({ length: pages }, (_, index) => index + 1), label: "Alles Farbe" };
  if (selection.colorMode === "manual") {
    const accounting = colorAccounting(pages, selection.manualColorPages);
    return { ...accounting, label: "Seiten selbst ausgewählt" };
  }
  const accounting = colorAccounting(pages, analysis?.colorPages ?? []);
  return { ...accounting, label: "Automatisch wie im PDF" };
}

export function paperLabel(paper: StudentPaper) {
  return ({
    "80g-weiss": "80 g weiß",
    "100g-weiss": "100 g weiß",
    "120g-weiss": "120 g weiß",
    "170g-bilderdruck": "170 g Bilderdruck"
  } satisfies Record<StudentPaper, string>)[paper];
}

export function bindingLabel(binding: StudentBinding) {
  return ({
    keine: "Keine Bindung",
    heftklammer: "Heftklammer",
    spiralbindung: "Spiralbindung",
    klebebindung: "Klebebindung",
    softcover: "Softcover",
    hardcover: "Hardcover"
  } satisfies Record<StudentBinding, string>)[binding];
}

export function productionLabel(production: StudentPrintSelection["production"]) {
  return production === "express" ? "Express" : production === "sameday" ? "Same Day" : "Standard";
}

export function productPriceConfig(product: ProductCatalogItem, selection: StudentPrintSelection) {
  const config: Record<string, string> = { auflage: String(selection.quantity) };
  const firstVariant = product.variants?.[0];
  for (const attribute of firstVariant?.attributes ?? []) {
    if (attribute.type !== "select") continue;
    const selected =
      attribute.key === "lieferzeit"
        ? selection.production
        : attribute.key === "grammatur"
          ? selection.paper === "120g-weiss" ? "135" : selection.paper === "170g-bilderdruck" ? "170" : "135"
          : attribute.defaultValue;
    const option = attribute.options?.find((item) => item.value === selected) ?? attribute.options?.find((item) => item.value === attribute.defaultValue) ?? attribute.options?.[0];
    config[attribute.key] = String(option?.value ?? "");
  }
  return config;
}
