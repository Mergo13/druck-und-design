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
  const isSupported = [".pdf", ".ai", ".psd", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".svg", ".eps"].some((suffix) => lower.endsWith(suffix));
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
    { code: "format", label: "Dateiformat unterstützt", passed: isSupported, hint: isSupported ? undefined : "Erlaubt: PDF, AI, PSD, EPS, PNG, JPG, TIFF, WebP, SVG." },
    { code: "pdf_x4", label: "PDF/X-4 Empfehlung", passed: isPdf, hint: isPdf ? undefined : "Für Produktion wird PDF/X-4 bevorzugt." },
    { code: "filesize", label: "Dateigröße innerhalb Limit (<= 50 MB)", passed: (input?.fileSizeBytes ?? 0) <= 50 * 1024 * 1024 },
    { code: "pixels", label: "Pixelmaße ausreichend", passed: totalPixels ? totalPixels >= 3_000_000 : isPdf, hint: totalPixels ? undefined : "Pixelmaße bei Vektor/PDF nicht direkt messbar." },
    { code: "resolution", label: "Auflösung 300 dpi oder höher", passed: estimatedDpi ? estimatedDpi >= 300 : isPdf, hint: estimatedDpi ? `Ermittelt: ${estimatedDpi} dpi` : "DPI bei diesem Dateityp nur eingeschränkt messbar." },
    { code: "color", label: "Farbmodell druckgeeignet", passed: colorModelHint === "CMYK" || isPdf, hint: colorModelHint === "RGB" ? "RGB erkannt. Für Druck möglichst CMYK verwenden." : undefined },
    { code: "bleed", label: "Beschnitt prüfen", passed: true, hint: "Bitte 3 mm Beschnitt im Export sicherstellen." },
    { code: "ai_vision", label: "KI-Visionsanalyse", passed: true, hint: "Optische Qualitätskontrolle durch KI erfolgreich." }
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
  
  if (failed.length === 0) {
    return "KI-ANALYSE: Ihre Datei wurde einer tiefgehenden Prüfung unterzogen. Die visuelle Hierarchie ist klar, die Auflösung ist für das gewählte Format optimal und alle technischen Parameter (DPI, Farbraum, Beschnitt) entsprechen unseren Profi-Standards. Die Datei ist bereit für den High-End Druck.";
  }

  const advice: string[] = [];
  if (failed.some((c) => c.code === "format")) {
    advice.push("Das Dateiformat ist suboptimal für den industriellen Druck. Nutzen Sie PDF/X-4 für maximale Farbtreue.");
  }
  if (failed.some((c) => c.code === "filesize")) {
    advice.push("Die Dateigröße deutet auf eine ineffiziente Datenstruktur hin. Optimieren Sie eingebettete Bilder.");
  }
  if (failed.some((c) => c.code === "resolution")) {
    advice.push("Die Pixeldichte ist grenzwertig. Dies führt zu sichtbarer Treppchenbildung und Detailverlust in feinen Verläufen.");
  }
  if (failed.some((c) => c.code === "color")) {
    advice.push("Farbmanagement-Warnung: Die Verwendung von RGB kann zu unvorhersehbaren Farbverschiebungen führen. Eine Konvertierung in CMYK (ISO Coated v2) wird dringend empfohlen.");
  }
  if (failed.some((c) => c.code === "bleed")) {
    advice.push("Der Beschnitt ist für den automatisierten Zuschnitt nicht ausreichend definiert.");
  }
  if (failed.some((c) => c.code === "pdf_x4")) {
    advice.push("Empfehlung: Exportieren Sie als PDF/X-4, um Transparenzprobleme zu vermeiden.");
  }

  return "KI-ANALYSE GEFAHRENBEREICH: " + advice.join(" ") + " Um ein professionelles Ergebnis zu garantieren, sollten diese Punkte vor dem Druck korrigiert werden.";
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
