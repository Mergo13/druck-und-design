import type { AutomationJob, FileCheckResult, ProductCatalogItem } from "@/types/print-platform";

export function calculateVariantPrice(product: ProductCatalogItem, variantId: string, quantity: number, selectedOptions: Record<string, string>) {
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const base = variant.priceRules.find((rule) => rule.key === "basis")?.amount ?? product.basePrice;
  const unit = variant.priceRules.find((rule) => rule.key === "auflage")?.amount ?? 0;
  const optionPrice = variant.attributes.reduce((sum, attribute) => {
    const selected = selectedOptions[attribute.key];
    const match = attribute.options?.find((option) => option.value === selected);
    return sum + (match?.priceModifier ?? 0);
  }, 0);
  return Math.round((base + unit * quantity + optionPrice) * 100) / 100;
}

export function runMockPreflight(
  filename: string,
  input?: { fileSizeBytes?: number; mimeType?: string; widthPx?: number; heightPx?: number; targetFormat?: string; colorModelHint?: "RGB" | "CMYK" | "Unknown" }
): FileCheckResult {
  const lower = filename.toLowerCase();
  const extension = lower.includes(".") ? lower.split(".").pop() ?? "unknown" : "unknown";
  const isSupported = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff"].some((suffix) => lower.endsWith(suffix));
  const isPdf = lower.endsWith(".pdf");
  const fileSizeMb = Number((((input?.fileSizeBytes ?? 0) / (1024 * 1024)).toFixed(2)));
  const widthPx = input?.widthPx;
  const heightPx = input?.heightPx;
  const totalPixels = widthPx && heightPx ? widthPx * heightPx : undefined;
  const colorModelHint = input?.colorModelHint ?? (input?.mimeType?.includes("pdf") ? "Unknown" : "RGB");
  const targetFormat = input?.targetFormat;
  const shortSideInches = targetFormat ? getFormatShortSideInches(targetFormat) : undefined;
  const estimatedDpi = widthPx && shortSideInches ? Math.round(widthPx / shortSideInches) : undefined;

  const checks = [
    { code: "format", label: "Dateiformat unterstützt", passed: isSupported, hint: isSupported ? undefined : "Erlaubt: PDF, AI, PSD, PNG, JPG, TIFF." },
    { code: "pdf_x4", label: "PDF/X-4 Empfehlung", passed: isPdf, hint: isPdf ? undefined : "Für Produktion wird PDF/X-4 bevorzugt." },
    { code: "filesize", label: "Dateigröße innerhalb Limit (<= 50 MB)", passed: (input?.fileSizeBytes ?? 0) <= 50 * 1024 * 1024 },
    { code: "pixels", label: "Pixelmaße ausreichend", passed: totalPixels ? totalPixels >= 3_000_000 : isPdf, hint: totalPixels ? undefined : "Pixelmaße bei Vektor/PDF nicht direkt messbar." },
    { code: "resolution", label: "Auflösung 300 dpi oder höher", passed: estimatedDpi ? estimatedDpi >= 300 : isPdf, hint: estimatedDpi ? `Ermittelt: ${estimatedDpi} dpi` : "DPI bei diesem Dateityp nur eingeschränkt messbar." },
    { code: "color", label: "Farbmodell druckgeeignet", passed: colorModelHint === "CMYK" || isPdf, hint: colorModelHint === "RGB" ? "RGB erkannt. Für Druck möglichst CMYK verwenden." : undefined },
    { code: "bleed", label: "Beschnitt prüfen", passed: true, hint: "Bitte 3 mm Beschnitt im Export sicherstellen." }
  ];

  return {
    filename,
    valid: checks.every((item) => item.passed),
    checks,
  metrics: {
      fileSizeMb,
      extension,
      mimeType: input?.mimeType,
      widthPx,
      heightPx,
      totalPixels,
      estimatedDpi,
      colorModelHint,
      targetFormat
    },
    aiAdvice: generateAIAdvice(checks)
  };
}

function generateAIAdvice(checks: Array<{ code: string; label: string; passed: boolean; hint?: string }>): string | undefined {
  const failed = checks.filter((c) => !c.passed);
  if (failed.length === 0) return "Ihre Druckdaten sehen hervorragend aus und sind bereit für die Produktion.";

  const advice: string[] = [];
  if (failed.some((c) => c.code === "format")) {
    advice.push("Bitte speichern Sie Ihre Datei in einem gängigen Druckformat wie PDF (bevorzugt PDF/X-4).");
  }
  if (failed.some((c) => c.code === "filesize")) {
    advice.push("Ihre Datei ist zu groß. Reduzieren Sie die Auflösung von Bildern auf 300 dpi oder nutzen Sie eine stärkere Kompression beim PDF-Export.");
  }
  if (failed.some((c) => c.code === "resolution")) {
    advice.push("Die Auflösung ist zu niedrig für ein scharfes Druckergebnis. Verwenden Sie Bilder mit mindestens 300 dpi in Originalgröße.");
  }
  if (failed.some((c) => c.code === "color")) {
    advice.push("Konvertieren Sie Ihr Dokument in den CMYK-Farbraum (z.B. ISO Coated v2), um Farbabweichungen zu vermeiden.");
  }

  if (advice.length === 0) {
    return "Es gibt kleinere Probleme mit Ihren Daten. Bitte prüfen Sie die Hinweise oben, um das beste Druckergebnis zu erzielen.";
  }

  return "Empfehlung: " + advice.join(" ");
}

function getFormatShortSideInches(format: string) {
  const key = format.toLowerCase().replaceAll(" ", "").replaceAll(".", "");
  const map: Record<string, number> = {
    "dina6": 4.13,
    "dina5": 5.83,
    "dina4": 8.27,
    "dinlang": 3.9,
    "quadrat": 5.91,
    "quadratisch": 5.91,
    "a4": 8.27
  };
  return map[key];
}

export function createAutomationJobs(projectId: string): AutomationJob[] {
  return [
    { id: `job-preflight-${projectId}`, type: "preflight", status: "queued", payload: { projectId } },
    { id: `job-render-${projectId}`, type: "render", status: "queued", payload: { projectId } },
    { id: `job-erp-sync-${projectId}`, type: "erp-sync", status: "queued", payload: { projectId } },
    { id: `job-nextcloud-${projectId}`, type: "nextcloud-upload", status: "queued", payload: { projectId } }
  ];
}
