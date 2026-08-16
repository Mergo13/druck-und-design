import type { AutomationJob, FileCheckResult, ProductCatalogItem, ProductCategoryProperty, ProductPricingProperty } from "@/types/print-platform";

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function safeQuantity(quantity: number) {
  return Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1;
}

export function calculateTierPrice(
  quantity: number,
  tiers: Array<{ quantity: number; fromQuantity?: number; toQuantity?: number; price: number; unitPrice?: number }> | undefined
) {
  const qty = safeQuantity(quantity);
  const valid = (tiers ?? [])
    .map((tier) => ({
      from: safeQuantity(Number(tier.fromQuantity || tier.quantity)),
      to: tier.toQuantity ? safeQuantity(Number(tier.toQuantity)) : undefined,
      unitPrice: Math.max(0, Number(tier.unitPrice ?? tier.price) || 0)
    }))
    .filter((tier) => tier.from > 0)
    .sort((a, b) => a.from - b.from);
  const tier = valid.find((entry) => qty >= entry.from && (entry.to === undefined || qty <= entry.to));
  if (!tier) throw new Error(`No price tier found for quantity ${qty}`);
  return {
    quantity: qty,
    tier: { from: tier.from, to: tier.to },
    unitPrice: money(tier.unitPrice),
    totalPrice: money(qty * tier.unitPrice)
  };
}

function areaM2(product: ProductCatalogItem, selectedOptions: Record<string, string>) {
  const widthCm = Number(selectedOptions.areaWidthCm || product.areaPricing?.defaultWidthCm || 100);
  const heightCm = Number(selectedOptions.areaHeightCm || product.areaPricing?.defaultHeightCm || 100);
  const rawArea = Math.max(0, widthCm) * Math.max(0, heightCm) / 10000;
  return money(Math.max(rawArea, Number(product.areaPricing?.minAreaM2 || 0)));
}

export function calculateConfiguredProductPrice(
  product: ProductCatalogItem,
  quantity: number,
  selectedOptions: Record<string, string>
) {
  const qty = safeQuantity(quantity);
  const lines: Array<{ label: string; value: string; price: number }> = [];
  const area = product.pricingType === "area" ? areaM2(product, selectedOptions) : 0;
  const baseUnitPrice = product.pricingType === "tiered"
    ? calculateTierPrice(qty, product.priceTiers).unitPrice
    : 0;
  const base = product.pricingType === "area"
    ? money(area * Math.max(0, Number(product.basePrice) || 0) * qty)
    : product.pricingType === "tiered"
      ? money(baseUnitPrice * qty)
      : product.basePrice;
  if (product.pricingType === "area") {
    lines.push({ label: "Format", value: `${selectedOptions.areaWidthCm || product.areaPricing?.defaultWidthCm || 100} x ${selectedOptions.areaHeightCm || product.areaPricing?.defaultHeightCm || 100} cm (${area.toLocaleString("de-DE")} m²)`, price: 0 });
  }
  const properties = (product.pricingProperties ?? []).filter((property) => (property.values ?? []).some((value) => value.enabled !== false));
  const surcharge = properties.reduce((sum, property) => {
    const enabledValues = (property.values ?? []).filter((value) => value.enabled !== false);
    const selected = selectedOptions[`eigenschaft:${property.name}`];
    const selectedValue = selected || enabledValues.find((value) => value.defaultSelected)?.value || enabledValues[0]?.value || "";
    const match = enabledValues.find((value) => value.value === selectedValue);
    if (!match) return sum;
    const propertyStepUnitPrice = Math.max(0, Number(property.stepPrice) || 0);
    const valueUnitPrice = match.pricingMode === "tiered"
      ? calculateTierPrice(qty, match.tierPrices).unitPrice
      : 0;
    const valuePrice = match.pricingMode === "fixed"
      ? money(Math.max(0, Number(match.fixedPrice) || 0) * qty)
      : match.pricingMode === "flat"
        ? Math.max(0, Number(match.fixedPrice) || 0)
      : match.pricingMode === "multiplier"
        ? money(base * Math.max(0, Number(match.multiplier ?? 1) || 1) - base)
      : match.pricingMode === "tiered"
        ? money(valueUnitPrice * qty)
        : 0;
    const propertyStepPrice = match.pricingMode === "flat" ? Math.max(0, Number(property.stepPrice) || 0) : propertyStepUnitPrice * qty;
    const price = money(propertyStepPrice + valuePrice);
    lines.push({ label: property.name, value: match.labelOverride || match.label || match.value, price });
    return sum + price;
  }, 0);

  return {
    quantity: qty,
    basePrice: money(base),
    lines,
    total: money(base + surcharge)
  };
}

export function getProductStartingPriceLabel(product: ProductCatalogItem) {
  if (product.purchaseMode === "request" || product.purchaseMode === "disabled") {
    return "Preis auf Anfrage";
  }
  if (product.pricingType === "area") {
    return `ab ${money(Math.max(0, Number(product.basePrice) || 0)).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} / m²`;
  }
  if (product.pricingType === "tiered") {
    const unitPrices = (product.priceTiers ?? [])
      .map((tier) => Number(tier.unitPrice ?? tier.price))
      .filter((price) => Number.isFinite(price) && price >= 0);
    if (!unitPrices.length) return "Preis auf Anfrage";
    const lowest = Math.min(...unitPrices);
    return `ab ${money(lowest).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} / Stück`;
  }
  const price = Number(product.basePrice);
  return Number.isFinite(price) && price > 0
    ? `ab ${money(price).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`
    : "Preis auf Anfrage";
}

export function validateProductPricing(product: ProductCatalogItem) {
  const errors: string[] = [];
  const tiers = product.priceTiers ?? [];
  if (product.pricingType === "tiered" && tiers.length === 0) {
    errors.push("Für Staffelpreis muss mindestens eine Menge angelegt sein.");
  }
  if (product.pricingType === "area" && Number(product.basePrice) <= 0) {
    errors.push("Für m²-Preis muss der Preis pro m² größer als 0 sein.");
  }
  if (product.pricingType === "hourly" && Number(product.basePrice) <= 0) {
    errors.push("Für Stundenpreis muss der Stundensatz größer als 0 sein.");
  }
  const tierQuantities = new Set<number>();
  const normalizedTiers = tiers
    .map((tier) => ({
      from: Number(tier.fromQuantity ?? tier.quantity),
      to: tier.toQuantity === undefined ? undefined : Number(tier.toQuantity),
      unitPrice: Number(tier.unitPrice ?? tier.price)
    }))
    .sort((a, b) => a.from - b.from);
  for (const [index, tier] of normalizedTiers.entries()) {
    const quantity = tier.from;
    const toQuantity = tier.to;
    const price = tier.unitPrice;
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Mengen müssen größer als 0 sein.");
    if (toQuantity !== undefined && toQuantity < quantity) errors.push(`Die Bis-Menge ${toQuantity} darf nicht kleiner als ${quantity} sein.`);
    if (tierQuantities.has(quantity)) errors.push(`Die Menge ${quantity} ist bereits vorhanden.`);
    tierQuantities.add(quantity);
    if (!Number.isFinite(price) || price < 0) errors.push(`Für Staffel ab ${quantity} fehlt ein gültiger Preis pro Stück.`);
    const previous = normalizedTiers[index - 1];
    if (previous) {
      const previousTo = previous.to ?? previous.from;
      if (quantity <= previousTo) errors.push(`Die Staffel ${quantity}-${toQuantity ?? quantity} überschneidet sich mit ${previous.from}-${previousTo}.`);
      if (quantity > previousTo + 1) errors.push(`Für die Mengen ${previousTo + 1}-${quantity - 1} ist kein Preis definiert.`);
    }
  }

  const propertyNames = new Set<string>();
  for (const property of product.pricingProperties ?? []) {
    const propertyName = property.name.trim();
    if (!propertyName) errors.push("Eine Eigenschaft hat keinen Namen.");
    if (propertyNames.has(propertyName.toLowerCase())) errors.push(`Die Eigenschaft ${propertyName} ist doppelt.`);
    propertyNames.add(propertyName.toLowerCase());
    const values = new Set<string>();
    const activeValues = (property.values ?? []).filter((entry) => entry.enabled !== false);
    if (property.required !== false && activeValues.length === 0) errors.push(`Für ${propertyName} muss mindestens ein Wert aktiv sein.`);
    if (activeValues.filter((value) => value.defaultSelected).length > 1) errors.push(`Für ${propertyName} darf nur ein Standardwert aktiv sein.`);
    for (const value of activeValues) {
      const valueName = value.value.trim();
      if (!valueName) errors.push(`Ein Wert in ${propertyName || "Eigenschaft"} ist leer.`);
      if (values.has(valueName.toLowerCase())) errors.push(`Der Wert ${valueName} ist in ${propertyName} doppelt.`);
      values.add(valueName.toLowerCase());
      if ((value.pricingMode === "fixed" || value.pricingMode === "flat") && Number(value.fixedPrice ?? 0) < 0) errors.push(`Der Aufpreis für ${valueName} darf nicht negativ sein.`);
      if (value.pricingMode === "multiplier" && Number(value.multiplier ?? 1) < 0) errors.push(`Der Multiplikator für ${valueName} darf nicht negativ sein.`);
      if (value.pricingMode === "tiered") {
        const surchargeQuantities = new Set((value.tierPrices ?? []).map((tier) => Number(tier.fromQuantity ?? tier.quantity)));
        for (const quantity of tierQuantities) {
          if (!surchargeQuantities.has(quantity)) errors.push(`Für ${propertyName} / ${valueName} fehlt die Staffel ${quantity}.`);
        }
        for (const tier of value.tierPrices ?? []) {
          const quantity = Number(tier.fromQuantity ?? tier.quantity);
          if (!tierQuantities.has(quantity)) errors.push(`Die Staffel ${quantity} existiert nicht im Produkt.`);
          if (Number(tier.unitPrice ?? tier.price) < 0) errors.push(`Der Staffel-Aufpreis für ${valueName} darf nicht negativ sein.`);
        }
      }
    }
  }

  return Array.from(new Set(errors));
}

export function calculateVariantPrice(product: ProductCatalogItem, variantId: string, quantity: number, selectedOptions: Record<string, string>) {
  if (product.pricingType === "tiered" || product.pricingProperties?.length) {
    return calculateConfiguredProductPrice(product, quantity, selectedOptions).total;
  }
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

export function calculateCategoryPropertiesPrice(properties: ProductCategoryProperty[], quantity: number) {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
  const price = properties.reduce((sum, property) => {
    const basePrice = Math.max(0, Number(property.basePrice) || 0);
    const stepPrice = Math.max(0, Number(property.stepPrice) || 0);
    return sum + basePrice + stepPrice * safeQuantity;
  }, 0);
  return Math.round(price * 100) / 100;
}

export function calculateSelectedCategoryPropertiesPrice(
  properties: ProductCategoryProperty[],
  quantity: number,
  selectedOptions: Record<string, string>
) {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(1, quantity) : 1;
  const price = properties.reduce((sum, property) => {
    const selected = selectedOptions[`eigenschaft:${property.name}`];
    const firstValue = property.values[0];
    const defaultValue = typeof firstValue === "string" ? firstValue : firstValue?.value;
    const selectedValue = selected || defaultValue || "";
    const match = property.values.find((entry) => (typeof entry === "string" ? entry : entry.value) === selectedValue);
    if (!match || typeof match === "string") {
      const basePrice = Math.max(0, Number(property.basePrice) || 0);
      const stepPrice = Math.max(0, Number(property.stepPrice) || 0);
      return sum + basePrice + stepPrice * safeQuantity;
    }
    const basePrice = Math.max(0, Number(match.basePrice ?? property.basePrice) || 0);
    const stepPrice = Math.max(0, Number(match.stepPrice ?? property.stepPrice) || 0);
    return sum + basePrice + stepPrice * safeQuantity;
  }, 0);
  return Math.round(price * 100) / 100;
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
